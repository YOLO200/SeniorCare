'use client';

import React, { useState, forwardRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { DeviceCard } from './DeviceCard';
import type { Device } from '@/lib/actions/devices';
import type { Parent } from '@/lib/actions';

interface MemberDevicesGroupProps {
  member: Parent;
  devices: Device[];
  onDeviceRemove: (memberId: number, deviceId: string) => void;
  onDeviceUpdate: (memberId: number, deviceId: string, updates: Partial<Device>) => void;
}

export interface MemberDevicesGroupRef {
  addDevice: (newDevice: Device) => void;
}

export const MemberDevicesGroup = forwardRef<MemberDevicesGroupRef, MemberDevicesGroupProps>(({ 
  member, 
  devices: initialDevices, 
  onDeviceRemove, 
  onDeviceUpdate 
}, ref) => {
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  const handleDeviceRemove = (deviceId: string) => {
    // Update local state immediately for responsive UI
    setDevices(prev => prev.filter(device => device.id !== deviceId));
    // Notify parent component
    onDeviceRemove(member.id, deviceId);
  };

  const handleDeviceUpdate = (deviceId: string, updates: Partial<Device>) => {
    // Update local state immediately for responsive UI
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, ...updates }
        : device
    ));
    // Notify parent component
    onDeviceUpdate(member.id, deviceId, updates);
  };

  // Add new device to local state when parent adds one
  const addDevice = (newDevice: Device) => {
    setDevices(prev => [...prev, newDevice]);
  };

  // Expose addDevice method to parent
  React.useImperativeHandle(ref, () => ({
    addDevice
  }));

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{member.name}</h3>
          <p className="text-sm text-slate-500">{member.phone_number}</p>
        </div>
        <Badge variant="secondary">
          {devices.length} {devices.length === 1 ? 'Device' : 'Devices'}
        </Badge>
      </div>
      
      {devices.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <p>No devices assigned to this member yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onRemove={handleDeviceRemove}
              onUpdate={handleDeviceUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
});

MemberDevicesGroup.displayName = 'MemberDevicesGroup';