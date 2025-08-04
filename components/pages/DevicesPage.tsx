'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Activity } from 'lucide-react';
import { getDevices, addDevice } from '@/lib/actions/devices';
import { getMembers } from '@/lib/actions';
import type { Parent } from '@/lib/actions';
import type { Device } from '@/lib/actions/devices';
import { AddDeviceModal } from '@/components/devices/AddDeviceModal';
import { MemberDevicesGroup, MemberDevicesGroupRef } from '@/components/devices/MemberDevicesGroup';

interface DevicesByMember {
  [memberId: number]: {
    member: Parent;
    devices: Device[];
  };
}

export default function DevicesPage() {
  const [devicesByMember, setDevicesByMember] = useState<DevicesByMember>({});
  const [members, setMembers] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const memberGroupRefs = useRef<{ [memberId: number]: MemberDevicesGroupRef }>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted]);

  const loadData = async () => {
    setLoading(true);
    
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      router.push('/auth/login');
      return;
    }

    // Load devices
    const devicesResult = await getDevices();
    if (devicesResult.error) {
      toast({
        title: 'Error',
        description: devicesResult.error,
        variant: 'destructive',
      });
    } else {
      groupDevicesByMember(devicesResult.data || []);
    }

    // Load members for the add device modal
    const membersResult = await getMembers();
    if (membersResult.error) {
      toast({
        title: 'Error',
        description: membersResult.error,
        variant: 'destructive',
      });
    } else {
      setMembers(membersResult.data || []);
    }

    setLoading(false);
  };

  const groupDevicesByMember = (devices: Device[]) => {
    const grouped = devices.reduce((acc, device) => {
      const memberId = device.parent_id;
      if (!acc[memberId]) {
        acc[memberId] = {
          member: device.parent!,
          devices: []
        };
      }
      acc[memberId].devices.push(device);
      return acc;
    }, {} as DevicesByMember);
    
    setDevicesByMember(grouped);
  };

  const handleAddDevice = async (parentId: number, deviceType: string, deviceName: string) => {
    const result = await addDevice(parentId, deviceType, deviceName);
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Device Added',
        description: 'Device has been added successfully.',
      });
      setShowAddModal(false);
      
      // Add device to local state without full reload
      const newDevice = result.data!;
      const member = members.find(m => m.id === parentId);
      
      if (member) {
        setDevicesByMember(prev => {
          const updated = { ...prev };
          if (!updated[parentId]) {
            updated[parentId] = {
              member,
              devices: []
            };
          }
          updated[parentId] = {
            ...updated[parentId],
            devices: [...updated[parentId].devices, newDevice]
          };
          return updated;
        });

        // Also add to the specific member group component if it exists
        const memberGroupRef = memberGroupRefs.current[parentId];
        if (memberGroupRef) {
          memberGroupRef.addDevice(newDevice);
        }
      }
    }
  };

  const handleDeviceRemove = (memberId: number, deviceId: string) => {
    setDevicesByMember(prev => {
      const updated = { ...prev };
      if (updated[memberId]) {
        updated[memberId] = {
          ...updated[memberId],
          devices: updated[memberId].devices.filter(d => d.id !== deviceId)
        };
        
        // Remove the member group if no devices left
        if (updated[memberId].devices.length === 0) {
          delete updated[memberId];
        }
      }
      return updated;
    });
  };

  const handleDeviceUpdate = (memberId: number, deviceId: string, updates: Partial<Device>) => {
    setDevicesByMember(prev => {
      const updated = { ...prev };
      if (updated[memberId]) {
        updated[memberId] = {
          ...updated[memberId],
          devices: updated[memberId].devices.map(device =>
            device.id === deviceId ? { ...device, ...updates } : device
          )
        };
      }
      return updated;
    });
  };

  // Filter devices based on search
  const filteredDevicesByMember = Object.entries(devicesByMember).reduce((acc, [memberId, group]) => {
    const filteredDevices = group.devices.filter(device => 
      device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.parent?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.device_type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const memberNameMatches = group.member.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Include the group if member name matches or if there are matching devices
    if (memberNameMatches || filteredDevices.length > 0) {
      acc[parseInt(memberId)] = {
        ...group,
        devices: memberNameMatches ? group.devices : filteredDevices
      };
    }
    
    return acc;
  }, {} as DevicesByMember);

  const totalDevices = Object.values(devicesByMember).reduce((sum, group) => sum + group.devices.length, 0);

  if (loading || !mounted) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-violet-700">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8 mt-16 lg:mt-0">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Device Management</h1>
        <p className="text-slate-600">Monitor and manage health devices for your care recipients</p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search devices, members, or device types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200"
            />
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-violet-500 hover:bg-violet-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>

        {totalDevices === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No devices yet</h3>
            <p className="text-slate-500 mb-4">Add your first health monitoring device</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-violet-500 hover:bg-violet-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Device
            </Button>
          </div>
        ) : Object.keys(filteredDevicesByMember).length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No devices found matching your search criteria</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(filteredDevicesByMember).map((group) => (
              <MemberDevicesGroup
                key={group.member.id}
                ref={(ref) => {
                  if (ref) {
                    memberGroupRefs.current[group.member.id] = ref;
                  }
                }}
                member={group.member}
                devices={group.devices}
                onDeviceRemove={handleDeviceRemove}
                onDeviceUpdate={handleDeviceUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddDeviceModal
          members={members}
          onAdd={handleAddDevice}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}