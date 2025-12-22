import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, KeyRound, Shield, Copy, RefreshCw } from 'lucide-react';
import { restaurantSearchService } from '../lib/firebase-service';
import { hashPassword } from '../lib/password-utils';

interface SecuritySettingsProps {
  restaurantId: string;
}

export function SecuritySettings({ restaurantId }: SecuritySettingsProps) {
  const [loading, setLoading] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [managerEmail, setManagerEmail] = useState('');
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load restaurant security data
  useEffect(() => {
    const loadSecurityData = async () => {
      try {
        const restaurantData = await restaurantSearchService.getRestaurantDataById(restaurantId);
        if (restaurantData) {
          setMasterPassword(restaurantData.managerMasterPassword || '');
          setManagerEmail(restaurantData.managerEmail || '');
        }
      } catch (error) {
        console.error('Error loading security data:', error);
        toast.error('Failed to load security settings');
      } finally {
        setLoading(false);
      }
    };

    loadSecurityData();
  }, [restaurantId]);

  const handleCopyMasterPassword = () => {
    navigator.clipboard.writeText(masterPassword);
    toast.success('Master password copied to clipboard');
  };

  const handleRegenerateMasterPassword = async () => {
    if (!confirm('Are you sure you want to regenerate the master password? All hosts will need the new password to sign in.')) {
      return;
    }

    try {
      // Generate new random master password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
      let newMasterPassword = '';
      for (let i = 0; i < 16; i++) {
        newMasterPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Update in database
      await restaurantSearchService.updateRestaurantData(restaurantId, {
        managerMasterPassword: newMasterPassword,
      });

      setMasterPassword(newMasterPassword);
      toast.success('Master password regenerated successfully');
    } catch (error) {
      console.error('Error regenerating master password:', error);
      toast.error('Failed to regenerate master password');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Verify current password
      const restaurantData = await restaurantSearchService.getRestaurantDataById(restaurantId);
      if (!restaurantData) {
        toast.error('Restaurant not found');
        return;
      }

      const { verifyPassword } = await import('../lib/password-utils');
      const isValidPassword = await verifyPassword(currentPassword, restaurantData.managerPasswordHash || '');
      
      if (!isValidPassword) {
        // Also check if it's the master password
        if (currentPassword !== restaurantData.managerMasterPassword) {
          toast.error('Current password is incorrect');
          return;
        }
      }

      // Hash the new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update the password hash in database
      await restaurantSearchService.updateRestaurantData(restaurantId, {
        managerPasswordHash: newPasswordHash,
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-400">Loading security settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl text-slate-100 mb-2">Security Settings</h2>
        <p className="text-slate-400 text-sm">
          Manage your password, master password, and other security settings
        </p>
      </div>

      {/* Master Password Section */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-start gap-3 mb-4">
          <KeyRound className="w-5 h-5 text-blue-400 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg text-slate-100 mb-1">Master Password</h3>
            <p className="text-sm text-slate-400">
              This password can be used by you and your hosts to sign in. Share it only with authorized team members.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 mb-2">Current Master Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showMasterPassword ? 'text' : 'password'}
                  value={masterPassword}
                  readOnly
                  className="bg-slate-900/50 border-slate-600 text-slate-100 pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowMasterPassword(!showMasterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                onClick={handleCopyMasterPassword}
                variant="outline"
                className="border-slate-600 hover:bg-slate-700"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleRegenerateMasterPassword}
            variant="outline"
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate Master Password
          </Button>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex gap-2">
              <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <strong>Warning:</strong> Regenerating the master password will require all hosts to use the new password for their next sign-in.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password Section */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-start gap-3 mb-4">
          <Lock className="w-5 h-5 text-blue-400 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg text-slate-100 mb-1">Change Manager Password</h3>
            <p className="text-sm text-slate-400">
              Update your personal manager password. This is different from the master password.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label className="text-slate-300 mb-2">Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-100 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 mb-2">New Password</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-100 pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 mb-2">Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-100 pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isChangingPassword}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </Card>

      {/* Account Information */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-400 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg text-slate-100 mb-1">Account Information</h3>
            <p className="text-sm text-slate-400">
              Your manager account details
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-slate-400 text-sm">Manager Email</Label>
            <div className="text-slate-100 mt-1 font-mono">{managerEmail}</div>
          </div>
          <div>
            <Label className="text-slate-400 text-sm">Restaurant ID</Label>
            <div className="text-slate-100 mt-1 font-mono text-sm">{restaurantId}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
