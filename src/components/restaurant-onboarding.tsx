import React, { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Check } from 'lucide-react';
import { ImageUpload } from './image-upload';
import { uploadRestaurantProfileImage } from '../lib/firebase-storage';
import { toast } from 'sonner';

const RESTAURANT_TYPES = [
  'Fine Dining',
  'Casual Dining',
  'Fast Casual',
  'Cafe',
  'Bar & Grill',
  'Steakhouse',
  'Italian',
  'Asian Fusion',
  'Mexican',
  'Mediterranean',
  'Seafood',
  'Vegetarian/Vegan',
  'Other'
];

export function RestaurantOnboarding() {
  const { updateRestaurantProfile, user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    restaurantName: '',
    cuisineType: '',
    address: '',
    phone: '',
    city: '',
    state: '',
    zipCode: '',
    capacity: '',
    description: '',
    website: '',
    openingTime: '11:00',
    closingTime: '22:00',
    profileImageUrl: '',
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Upload image if one was selected
      let uploadedImageUrl = formData.profileImageUrl;
      if (selectedImageFile && user) {
        try {
          uploadedImageUrl = await uploadRestaurantProfileImage(user.uid, selectedImageFile);
          toast.success('Profile image uploaded successfully!');
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image, but continuing with setup');
        }
      }
      
      // Build opening hours object
      const openingHours = {
        monday: { open: formData.openingTime, close: formData.closingTime, isClosed: false },
        tuesday: { open: formData.openingTime, close: formData.closingTime, isClosed: false },
        wednesday: { open: formData.openingTime, close: formData.closingTime, isClosed: false },
        thursday: { open: formData.openingTime, close: formData.closingTime, isClosed: false },
        friday: { open: formData.openingTime, close: formData.closingTime, isClosed: false },
        saturday: { open: formData.openingTime, close: formData.closingTime, isClosed: false },
        sunday: { open: formData.openingTime, close: formData.closingTime, isClosed: false },
      };

      await updateRestaurantProfile({
        restaurantName: formData.restaurantName,
        cuisineType: formData.cuisineType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phone: formData.phone,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        description: formData.description || undefined,
        website: formData.website || undefined,
        openingHours,
        photos: uploadedImageUrl ? [uploadedImageUrl] : undefined,
        hasCompletedOnboarding: true,
      });
      
      toast.success('Restaurant profile completed successfully!');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = formData.restaurantName && formData.cuisineType;
  const isStep2Valid = formData.address && formData.city && formData.state && formData.zipCode;
  const isStep3Valid = formData.phone && formData.capacity;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <CardTitle className="text-2xl text-white">Restaurant Setup</CardTitle>
              <CardDescription className="text-zinc-400">
                Step {step} of {totalSteps}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                    s < step
                      ? 'bg-blue-600 text-white'
                      : s === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
              ))}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h3 className="text-lg text-white">Basic Information</h3>
                <p className="text-sm text-zinc-400">
                  Let's start with the essentials about your restaurant
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName" className="text-white">
                    Restaurant Name
                  </Label>
                  <Input
                    id="restaurantName"
                    placeholder="e.g., The Blue Bistro"
                    value={formData.restaurantName}
                    onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantType" className="text-white">
                    Restaurant Type
                  </Label>
                  <Select
                    value={formData.cuisineType}
                    onValueChange={(value) => handleInputChange('cuisineType', value)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue placeholder="Select restaurant type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {RESTAURANT_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="text-white">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h3 className="text-lg text-white">Location</h3>
                <p className="text-sm text-zinc-400">
                  Where is your restaurant located?
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">
                    Street Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">
                      City
                    </Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">
                      State
                    </Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-white">
                    ZIP Code
                  </Label>
                  <Input
                    id="zipCode"
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-900"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isStep2Valid}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h3 className="text-lg text-white">Restaurant Details</h3>
                <p className="text-sm text-zinc-400">
                  Final details to complete your profile
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-white">
                    Seating Capacity
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="50"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openingTime" className="text-white">
                      Opening Time
                    </Label>
                    <Input
                      id="openingTime"
                      type="time"
                      value={formData.openingTime}
                      onChange={(e) => handleInputChange('openingTime', e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closingTime" className="text-white">
                      Closing Time
                    </Label>
                    <Input
                      id="closingTime"
                      type="time"
                      value={formData.closingTime}
                      onChange={(e) => handleInputChange('closingTime', e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">
                    Description (Optional)
                  </Label>
                  <Input
                    id="description"
                    placeholder="Brief description of your restaurant"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-white">
                    Website (Optional)
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourrestaurant.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Profile Image (Optional)
                  </Label>
                  <ImageUpload
                    currentImage={formData.profileImageUrl}
                    onImageSelect={(file, previewUrl) => {
                      setSelectedImageFile(file);
                      handleInputChange('profileImageUrl', previewUrl);
                    }}
                    onImageRemove={() => {
                      setSelectedImageFile(null);
                      handleInputChange('profileImageUrl', '');
                    }}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-zinc-500">
                    Upload a profile image for your restaurant
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-900"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isStep3Valid || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Completing setup...</span>
                    </div>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}