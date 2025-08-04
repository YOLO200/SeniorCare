'use server';

import { createClient } from '@/lib/supabase/server';

export interface Device {
  id: string;
  parent_id: number;
  device_type: string;
  device_model?: string;
  device_name: string;
  status: 'connected' | 'disconnected' | 'syncing';
  last_sync?: string;
  battery_level?: number;
  created_at: string;
  updated_at: string;
  parent?: {
    id: number;
    name: string;
    phone_number: string;
  };
}

export async function getDevices() {
  try {
    const supabase = await createClient();
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return { error: 'Not authenticated', data: null };
    }

    const { data: user, error: userDataError } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_id', userData.user.id)
      .single();

    if (userDataError || !user) {
      return { error: 'User not found', data: null };
    }

    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        parent:parents(id, name, phone_number)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching devices:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data: data || [] };
  } catch (error) {
    console.error('Error in getDevices:', error);
    return { error: 'Failed to fetch devices', data: null };
  }
}

export async function addDevice(parentId: number, deviceType: string, deviceName: string) {
  try {
    const supabase = await createClient();
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return { error: 'Not authenticated', data: null };
    }

    const { data: user, error: userDataError } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_id', userData.user.id)
      .single();

    if (userDataError || !user) {
      return { error: 'User not found', data: null };
    }

    const { data, error } = await supabase
      .from('devices')
      .insert([{
        parent_id: parentId,
        device_type: deviceType,
        device_name: deviceName,
        user_id: user.id,
        status: 'disconnected'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding device:', error);
      return { error: error.message, data: null };
    }

    // Remove revalidatePath to avoid full page reload
    return { error: null, data };
  } catch (error) {
    console.error('Error in addDevice:', error);
    return { error: 'Failed to add device', data: null };
  }
}

export async function updateDeviceStatus(deviceId: string, status: 'connected' | 'disconnected' | 'syncing') {
  try {
    const supabase = await createClient();
    
    const updates: any = { status };
    if (status === 'connected') {
      updates.last_sync = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', deviceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating device status:', error);
      return { error: error.message, data: null };
    }

    // Remove revalidatePath to avoid full page reload
    return { error: null, data };
  } catch (error) {
    console.error('Error in updateDeviceStatus:', error);
    return { error: 'Failed to update device status', data: null };
  }
}

export async function removeDevice(deviceId: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      console.error('Error removing device:', error);
      return { error: error.message };
    }

    // Remove revalidatePath to avoid full page reload
    return { error: null };
  } catch (error) {
    console.error('Error in removeDevice:', error);
    return { error: 'Failed to remove device' };
  }
}

export async function syncDevice(deviceId: string) {
  try {
    const supabase = await createClient();
    
    // First, set status to syncing
    await supabase
      .from('devices')
      .update({ status: 'syncing' })
      .eq('id', deviceId);

    // In a real implementation, this would trigger the actual device sync
    // For now, we'll simulate it with a timeout
    setTimeout(async () => {
      await supabase
        .from('devices')
        .update({ 
          status: 'connected',
          last_sync: new Date().toISOString(),
          battery_level: Math.floor(Math.random() * 100) // Simulated battery level
        })
        .eq('id', deviceId);
      
      // Remove revalidatePath to avoid full page reload
    }, 2000);

    return { error: null };
  } catch (error) {
    console.error('Error in syncDevice:', error);
    return { error: 'Failed to sync device' };
  }
}