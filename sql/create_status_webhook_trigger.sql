-- ============================================================================
-- Migration: Create trigger function for status change webhooks
-- Date: 2026-01-10
-- Purpose: Send all lead data to n8n webhook when Status column changes
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_status_webhook ON solar.solar_leads;
DROP FUNCTION IF EXISTS notify_status_change_solar();

-- Create the trigger function
CREATE OR REPLACE FUNCTION notify_status_change_solar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook_url TEXT := 'https://n8n.valourholdings.co.uk/webhook/statusupdate';
  v_payload JSONB;
BEGIN
  -- Only proceed if Status column has actually changed
  IF (TG_OP = 'UPDATE' AND OLD."Status" IS DISTINCT FROM NEW."Status") THEN

    -- Build the complete payload with all 33 columns
    v_payload := jsonb_build_object(
      'id', NEW.id,
      'Created_At', NEW."Created_At",
      'Customer_Name', NEW."Customer_Name",
      'Customer_Tel', NEW."Customer_Tel",
      'Alternative_Tel', NEW."Alternative_Tel",
      'Customer_Email', NEW."Customer_Email",
      'First_Line_Of_Address', NEW."First_Line_Of_Address",
      'Postcode', NEW."Postcode",
      'Property_Type', NEW."Property_Type",
      'Monthly_Electricity_Costs', NEW."Monthly_Electricity_Costs",
      'Lead_Source', NEW."Lead_Source",
      'Account_Manager', NEW."Account_Manager",
      'Field_Rep', NEW."Field_Rep",
      'Installer', NEW."Installer",
      'Installer_Assigned_Date', NEW."Installer_Assigned_Date",
      'Status', NEW."Status",
      'Survey_Booked_Date', NEW."Survey_Booked_Date",
      'Survey_Complete_Date', NEW."Survey_Complete_Date",
      'Install_Booked_Date', NEW."Install_Booked_Date",
      'Paid_Date', NEW."Paid_Date",
      'Fall_Off_Stage', NEW."Fall_Off_Stage",
      'Fall_Off_Reason', NEW."Fall_Off_Reason",
      'Payment_Model', NEW."Payment_Model",
      'Lead_Cost', NEW."Lead_Cost",
      'Lead_Revenue', NEW."Lead_Revenue",
      'Commission_Amount', NEW."Commission_Amount",
      'Commission_Paid', NEW."Commission_Paid",
      'Commission_Paid_Date', NEW."Commission_Paid_Date",
      'Notes', NEW."Notes",
      'Installer_Notes', NEW."Installer_Notes",
      'Front_Elevation_Image', NEW."Front_Elevation_Image",
      'Survey_Status', NEW."Survey_Status",
      'Contact_ID', NEW."Contact_ID",
      -- Metadata for n8n workflow
      'trigger_metadata', jsonb_build_object(
        'old_status', OLD."Status",
        'new_status', NEW."Status",
        'updated_at', NOW(),
        'trigger_source', 'postgresql_trigger'
      )
    );

    -- Make async HTTP POST request using pg_net
    PERFORM net.http_post(
      url := v_webhook_url,
      body := v_payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'User-Agent', 'Supabase-PostgreSQL-Trigger',
        'X-Trigger-Type', 'status_change'
      ),
      timeout_milliseconds := 5000  -- 5 second timeout
    );

    -- Log for debugging
    RAISE NOTICE 'Status webhook triggered: Lead ID %, Status: % -> %',
      NEW.id, OLD."Status", NEW."Status";

  END IF;

  -- Always return NEW to allow the UPDATE to proceed
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the update
    RAISE WARNING 'Status webhook error for lead %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION notify_status_change_solar() IS
  'Sends async HTTP POST to n8n webhook when lead Status changes. Non-blocking.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION notify_status_change_solar() TO postgres;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: notify_status_change_solar() function created';
END $$;
