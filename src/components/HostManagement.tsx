import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { UserPlus, Mail, User, Trash2, CheckCircle2, XCircle, Loader2, Copy, Eye, EyeOff, Key } from 'lucide-react';
import { restaurantSearchService } from '../lib/firebase-service';
import { useAuth } from './auth-provider';
import { toast } from 'sonner';

interface HostEmployee {
  email: string;
  name: string;
  addedAt: {
    toDate?: () => Date;
  } | Date;
  addedBy: string;
  status: 'active' | 'inactive';
  masterPassword?: string;
}

// Generate a random master password
const generateMasterPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export function HostManagement() {
  const { user, restaurantProfile } = useAuth();
  const [hosts, setHosts] = useState<HostEmployee[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHostEmail, setNewHostEmail] = useState('');
  const [newHostName, setNewHostName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hostAdded, setHostAdded] = useState(false);

  // Load hosts from restaurant profile
  useEffect(() => {
    if (restaurantProfile?.authorizedHosts) {
      setHosts(restaurantProfile.authorizedHosts as HostEmployee[]);
    }
  }, [restaurantProfile]);

  const handleAddHost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setError('You must be signed in to add hosts');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const masterPassword = generateMasterPassword();
      const success = await restaurantSearchService.addHost(user.uid, {
        email: newHostEmail.trim(),
        name: newHostName.trim(),
        addedBy: user.uid,
        masterPassword: masterPassword,
      });

      if (success) {
        setSuccessMessage(`Successfully added ${newHostName} as a host`);
        setNewHostEmail('');
        setNewHostName('');
        setIsAddDialogOpen(false);
        setGeneratedPassword(masterPassword);
        setHostAdded(true);
        
        // Refresh the list
        const restaurant = await restaurantSearchService.getById(user.uid);
        if (restaurant?.authorizedHosts) {
          setHosts(restaurant.authorizedHosts as HostEmployee[]);
        }
      } else {
        setError('Failed to add host. The email may already exist.');
      }
    } catch (err) {
      console.error('Error adding host:', err);
      setError('An error occurred while adding the host');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveHost = async (hostEmail: string) => {
    if (!user?.uid) return;
    if (!confirm(`Are you sure you want to remove this host?`)) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const success = await restaurantSearchService.removeHost(user.uid, hostEmail);
      
      if (success) {
        setSuccessMessage('Host removed successfully');
        
        // Refresh the list
        const restaurant = await restaurantSearchService.getById(user.uid);
        if (restaurant?.authorizedHosts) {
          setHosts(restaurant.authorizedHosts as HostEmployee[]);
        }
      } else {
        setError('Failed to remove host');
      }
    } catch (err) {
      console.error('Error removing host:', err);
      setError('An error occurred while removing the host');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (hostEmail: string, currentStatus: 'active' | 'inactive') => {
    if (!user?.uid) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const success = await restaurantSearchService.updateHostStatus(user.uid, hostEmail, newStatus);
      
      if (success) {
        setSuccessMessage(`Host ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        
        // Refresh the list
        const restaurant = await restaurantSearchService.getById(user.uid);
        if (restaurant?.authorizedHosts) {
          setHosts(restaurant.authorizedHosts as HostEmployee[]);
        }
      } else {
        setError('Failed to update host status');
      }
    } catch (err) {
      console.error('Error updating host status:', err);
      setError('An error occurred while updating the host status');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: unknown): string => {
    if (!date) return 'Unknown';
    
    try {
      // Type guard for Firestore Timestamp
      if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate?: unknown }).toDate === 'function') {
        return ((date as { toDate: () => Date }).toDate()).toLocaleDateString();
      }
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      return new Date(date as string | number).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-slate-100 mb-2">Host Management</h2>
          <p className="text-slate-400">Manage authorized hosts for your restaurant</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Host
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Hosts List */}
      <div className="grid gap-4">
        {hosts.length > 0 ? (
          hosts.map((host, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-full ${host.status === 'active' ? 'bg-green-500/10' : 'bg-slate-700'}`}>
                    <User className={`w-5 h-5 ${host.status === 'active' ? 'text-green-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-slate-100">{host.name}</h3>
                      {host.status === 'active' ? (
                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-slate-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{host.email}</span>
                      </div>
                      <span>Added {formatDate(host.addedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(host.email, host.status)}
                    disabled={isLoading}
                    className={`border-slate-600 ${
                      host.status === 'active' 
                        ? 'text-yellow-400 hover:bg-yellow-500/10' 
                        : 'text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {host.status === 'active' ? (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveHost(host.email)}
                    disabled={isLoading}
                    className="border-slate-600 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <div className="text-center text-slate-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hosts added yet</p>
              <p className="text-sm mt-1">Click "Add Host" to authorize staff members</p>
            </div>
          </Card>
        )}
      </div>

      {/* Add Host Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Host</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a host by entering their email and name. They will be able to sign in once added.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddHost} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="hostName" className="text-slate-200">Host Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="hostName"
                  type="text"
                  placeholder="John Doe"
                  value={newHostName}
                  onChange={(e) => setNewHostName(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostEmail" className="text-slate-200">Host Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="hostEmail"
                  type="email"
                  placeholder="host@example.com"
                  value={newHostEmail}
                  onChange={(e) => setNewHostEmail(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">
                The host will use this email to sign in and access the host portal
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewHostEmail('');
                  setNewHostName('');
                  setError('');
                }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Host
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Host Added Dialog */}
      <Dialog open={hostAdded} onOpenChange={setHostAdded}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl">Host Added Successfully</DialogTitle>
            <DialogDescription className="text-slate-400">
              The host has been added successfully. Please share the master password with them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="masterPassword" className="text-slate-200">Master Password</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="masterPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPassword}
                  className="pl-10 pr-12 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                This password is required for the host to sign in for the first time.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHostAdded(false);
                  setGeneratedPassword('');
                  setShowPassword(false);
                }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    // Try to use the Clipboard API
                    await navigator.clipboard.writeText(generatedPassword);
                    toast.success('Password copied to clipboard');
                  } catch {
                    // Fallback: Create a temporary input element and select the text
                    const textArea = document.createElement('textarea');
                    textArea.value = generatedPassword;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                      document.execCommand('copy');
                      toast.success('Password copied to clipboard');
                    } catch {
                      // If both methods fail, show the password in a toast
                      toast.info('Copy manually: ' + generatedPassword, {
                        duration: 10000,
                        description: 'Select and copy the password above',
                      });
                    }
                    
                    document.body.removeChild(textArea);
                  }
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}