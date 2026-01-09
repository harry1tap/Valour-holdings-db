/**
 * Database Types for Valour Holdings Dashboard
 * These types represent the structure of our Supabase database
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'account_manager' | 'field_rep'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: UserRole
          account_manager_name: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: UserRole
          account_manager_name?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: UserRole
          account_manager_name?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
    }
  }
  solar: {
    Tables: {
      solar_leads: {
        Row: {
          id: number
          Created_At: string | null
          Customer_Name: string | null
          Customer_Tel: string | null
          Alternative_Tel: string | null
          Customer_Email: string | null
          First_Line_Of_Address: string | null
          Postcode: string | null
          Property_Type: string | null
          Monthly_Electricity_Costs: string | null
          Lead_Source: string | null
          Account_Manager: string | null
          Field_Rep: string | null
          Installer: string | null
          Installer_Assigned_Date: string | null
          Status: string | null
          Survey_Booked_Date: string | null
          Survey_Complete_Date: string | null
          Install_Booked_Date: string | null
          Paid_Date: string | null
          Fall_Off_Stage: string | null
          Fall_Off_Reason: string | null
          Payment_Model: string | null
          Lead_Cost: number | null
          Lead_Revenue: number | null
          Commission_Amount: number | null
          Commission_Paid: string | null
          Commission_Paid_Date: string | null
          Notes: string | null
          Installer_Notes: string | null
          Front_Elevation_Image: string | null
          Survey_Status: string | null
        }
        Insert: {
          id?: number
          Created_At?: string | null
          Customer_Name?: string | null
          Customer_Tel?: string | null
          Alternative_Tel?: string | null
          Customer_Email?: string | null
          First_Line_Of_Address?: string | null
          Postcode?: string | null
          Property_Type?: string | null
          Monthly_Electricity_Costs?: string | null
          Lead_Source?: string | null
          Account_Manager?: string | null
          Field_Rep?: string | null
          Installer?: string | null
          Installer_Assigned_Date?: string | null
          Status?: string | null
          Survey_Booked_Date?: string | null
          Survey_Complete_Date?: string | null
          Install_Booked_Date?: string | null
          Paid_Date?: string | null
          Fall_Off_Stage?: string | null
          Fall_Off_Reason?: string | null
          Payment_Model?: string | null
          Lead_Cost?: number | null
          Lead_Revenue?: number | null
          Commission_Amount?: number | null
          Commission_Paid?: string | null
          Commission_Paid_Date?: string | null
          Notes?: string | null
          Installer_Notes?: string | null
          Front_Elevation_Image?: string | null
          Survey_Status?: string | null
        }
        Update: {
          id?: number
          Created_At?: string | null
          Customer_Name?: string | null
          Customer_Tel?: string | null
          Alternative_Tel?: string | null
          Customer_Email?: string | null
          First_Line_Of_Address?: string | null
          Postcode?: string | null
          Property_Type?: string | null
          Monthly_Electricity_Costs?: string | null
          Lead_Source?: string | null
          Account_Manager?: string | null
          Field_Rep?: string | null
          Installer?: string | null
          Installer_Assigned_Date?: string | null
          Status?: string | null
          Survey_Booked_Date?: string | null
          Survey_Complete_Date?: string | null
          Install_Booked_Date?: string | null
          Paid_Date?: string | null
          Fall_Off_Stage?: string | null
          Fall_Off_Reason?: string | null
          Payment_Model?: string | null
          Lead_Cost?: number | null
          Lead_Revenue?: number | null
          Commission_Amount?: number | null
          Commission_Paid?: string | null
          Commission_Paid_Date?: string | null
          Notes?: string | null
          Installer_Notes?: string | null
          Front_Elevation_Image?: string | null
          Survey_Status?: string | null
        }
      }
      expenses: {
        Row: {
          id: number
          expense_date: string
          category: string
          description: string
          total_amount: number
          online_amount: number
          field_amount: number
          created_at: string
          created_by: string | null
          notes: string | null
        }
        Insert: {
          id?: number
          expense_date: string
          category: string
          description: string
          total_amount: number
          online_amount: number
          field_amount: number
          created_at?: string
          created_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: number
          expense_date?: string
          category?: string
          description?: string
          total_amount?: number
          online_amount?: number
          field_amount?: number
          created_at?: string
          created_by?: string | null
          notes?: string | null
        }
      }
    }
  }
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type SolarLead = Database['solar']['Tables']['solar_leads']['Row']
export type Expense = Database['solar']['Tables']['expenses']['Row']
