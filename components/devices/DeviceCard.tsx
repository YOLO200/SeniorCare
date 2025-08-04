'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  Battery, 
  Trash2,
  Watch,
  Smartphone,
  Activity
} from 'lucide-react';
import { updateDeviceStatus, removeDevice, syncDevice } from '@/lib/actions/devices';
import type { Device } from '@/lib/actions/devices';

interface DeviceCardProps {
  device: Device;
  onRemove: (deviceId: string) => void;
  onUpdate: (deviceId: string, updates: Partial<Device>) => void;
}

export function DeviceCard({ device, onRemove, onUpdate }: DeviceCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType.toLowerCase();
    if (type.includes('watch')) return <Watch className="h-5 w-5" />;
    if (type.includes('phone')) return <Smartphone className="h-5 w-5" />;
    return <Activity className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Wifi className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      case 'syncing':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never synced';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const handleSyncDevice = async () => {
    setIsSyncing(true);
    
    // Update local state immediately for responsive UI
    onUpdate(device.id, { status: 'syncing' });
    
    const result = await syncDevice(device.id);
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
      // Revert to previous status on error
      onUpdate(device.id, { status: device.status });
    } else {
      toast({
        title: 'Syncing',
        description: 'Device sync initiated.',
      });
      
      // Simulate sync completion after 2.5 seconds
      setTimeout(() => {
        onUpdate(device.id, { 
          status: 'connected',
          last_sync: new Date().toISOString(),
          battery_level: Math.floor(Math.random() * 100)
        });
        setIsSyncing(false);
      }, 2500);
    }
  };

  const handleRemoveDevice = async () => {
    setIsLoading(true);
    
    const result = await removeDevice(device.id);
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      toast({
        title: 'Device Removed',
        description: 'Device has been removed successfully.',
      });
      // Call parent component to remove from state
      onRemove(device.id);
    }
  };

  const currentStatus = isSyncing ? 'syncing' : device.status;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getDeviceIcon(device.device_type)}
          <div>
            <h4 className="font-medium text-slate-800">
              {device.device_name}
            </h4>
            <p className="text-sm text-slate-500">
              {device.device_type}
            </p>
          </div>
        </div>
        {getStatusBadge(currentStatus)}
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-slate-600">
          Last sync: {formatLastSync(device.last_sync)}
        </p>
        {device.battery_level !== null && device.battery_level !== undefined && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Battery className="h-3 w-3" />
            <span>{device.battery_level}%</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSyncDevice}
          disabled={isSyncing || currentStatus === 'syncing' || isLoading}
          className="flex-1"
        >
          {isSyncing || currentStatus === 'syncing' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Sync'
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRemoveDevice}
          disabled={isLoading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}