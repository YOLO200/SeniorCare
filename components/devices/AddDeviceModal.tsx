'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { X } from 'lucide-react';
import type { Parent } from '@/lib/actions';

const DEVICE_TYPES = [
  { value: 'Dexcom G6', label: 'Dexcom G6' },
  { value: 'Dexcom G7', label: 'Dexcom G7' },
  { value: 'WHOOP 4.0', label: 'WHOOP 4.0' },
  { value: 'Apple Watch Series 8', label: 'Apple Watch Series 8' },
  { value: 'Apple Watch Series 9', label: 'Apple Watch Series 9' },
  { value: 'Apple Watch Ultra', label: 'Apple Watch Ultra' },
  { value: 'Samsung Galaxy Watch 5', label: 'Samsung Galaxy Watch 5' },
  { value: 'Samsung Galaxy Watch 6', label: 'Samsung Galaxy Watch 6' },
  { value: 'Withings ScanWatch', label: 'Withings ScanWatch' },
  { value: 'Withings Body+', label: 'Withings Body+' },
  { value: 'Withings BPM Connect', label: 'Withings BPM Connect' },
  { value: 'Other', label: 'Other Device' },
];

const formSchema = z.object({
  parentId: z.string().min(1, 'Please select a member'),
  deviceType: z.string().min(1, 'Please select a device type'),
  deviceName: z.string().min(1, 'Please enter a device name'),
});

interface AddDeviceModalProps {
  members: Parent[];
  onAdd: (parentId: number, deviceType: string, deviceName: string) => void;
  onClose: () => void;
}

export function AddDeviceModal({ members, onAdd, onClose }: AddDeviceModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentId: '',
      deviceType: '',
      deviceName: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    await onAdd(parseInt(values.parentId), values.deviceType, values.deviceName);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Add Device</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Member</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a device type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEVICE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Dad's Apple Watch" 
                      {...field}
                      className="bg-white border-slate-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white"
              >
                {loading ? 'Adding...' : 'Add Device'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}