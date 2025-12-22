import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Building2, MapPin, ChefHat, Loader2, Mail, Key, ArrowRight } from 'lucide-react';
import { restaurantSearchService, type RestaurantSearchResult } from '../lib/firebase-service';

interface HostSignInProps {
  onHostSignIn: (restaurantId: string, hostEmail: string, hostName: string, role: 'host' | 'manager') => void;
  onBack: () => void;
}

export function HostSignIn({ onHostSignIn, onBack }: HostSignInProps) {
  const [step, setStep] = useState<'search' | 'credentials'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<RestaurantSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSearchResult | null>(null);
  const [hostEmail, setHostEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Load default restaurants on mount
  useEffect(() => {
    const loadDefaultRestaurants = async () => {
      setIsSearching(true);
      try {
        const results = await restaurantSearchService.getDefaultRestaurants();
        setSearchResults(results);
      } catch (err) {
        console.error('Error loading default restaurants:', err);
        setError('Failed to load restaurants. Please try again.');
      } finally {
        setIsSearching(false);
      }
    };

    loadDefaultRestaurants();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true);
        setError('');
        try {
          const results = await restaurantSearchService.searchByName(searchTerm);
          setSearchResults(results);
          
          if (results.length === 0) {
            setError('No restaurants found. Try a different search term.');
          }
        } catch (err) {
          console.error('Search error:', err);
          setError('Failed to search restaurants. Please try again.');
        } finally {
          setIsSearching(false);
        }
      } else if (searchTerm.trim().length === 0) {
        // If search is cleared, reload default restaurants
        const loadDefaults = async () => {
          setIsSearching(true);
          try {
            const results = await restaurantSearchService.getDefaultRestaurants();
            setSearchResults(results);
            setError('');
          } catch (err) {
            console.error('Error loading default restaurants:', err);
          } finally {
            setIsSearching(false);
          }
        };
        loadDefaults();
      } else {
        // Less than 2 characters but not empty - show nothing
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectRestaurant = (restaurant: RestaurantSearchResult) => {
    setSelectedRestaurant(restaurant);
    setStep('credentials');
    setError('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRestaurant) {
      setError('Please select a restaurant first');
      return;
    }

    setIsSigningIn(true);
    setError('');

    try {
      // Verify host credentials
      const result = await restaurantSearchService.verifyHostCredentials(
        selectedRestaurant.id,
        hostEmail.trim(),
        masterPassword.trim()
      );

      if (result.verified) {
        // Sign in successful - ensure role is defined
        const role = result.role || 'host'; // Default to 'host' if role is undefined
        onHostSignIn(selectedRestaurant.id, hostEmail, result.hostName || 'Host', role);
      } else {
        setError('Invalid email or master password for this restaurant.');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === 'search' ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl text-slate-100 mb-2">Sign In to Restaurant</h3>
              <p className="text-slate-400">First, search for your restaurant</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                type="text"
                placeholder="Search by restaurant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {searchResults.length > 0 ? (
                searchResults.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className="w-full p-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-blue-500 rounded-lg text-left transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-blue-400" />
                          <h3 className="text-slate-100 group-hover:text-blue-400 transition-colors">
                            {restaurant.restaurantName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <ChefHat className="w-4 h-4" />
                            <span>{restaurant.cuisineType}</span>
                          </div>
                          {restaurant.city && restaurant.state && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{restaurant.city}, {restaurant.state}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))
              ) : !isSearching && searchTerm.trim().length >= 2 ? (
                <div className="text-center py-8 text-slate-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No restaurants found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : !isSearching && searchTerm.trim().length < 2 && searchTerm.trim().length > 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Keep typing to search</p>
                  <p className="text-sm mt-1">Enter at least 2 characters</p>
                </div>
              ) : !isSearching ? (
                <div className="text-center py-8 text-slate-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No restaurants available</p>
                  <p className="text-sm mt-1">Please contact support</p>
                </div>
              ) : null}
            </div>

            <Button
              onClick={onBack}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              ← Back
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <Button
                onClick={() => {
                  setStep('search');
                  setSelectedRestaurant(null);
                  setHostEmail('');
                  setMasterPassword('');
                  setError('');
                }}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-slate-100 mb-4"
              >
                ← Change Restaurant
              </Button>
              
              <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="text-slate-100">{selectedRestaurant?.restaurantName}</h4>
                    <p className="text-sm text-slate-400">{selectedRestaurant?.cuisineType}</p>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl text-slate-100 mb-2">Enter Your Credentials</h3>
              <p className="text-slate-400">Sign in to access your restaurant</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="hostEmail" className="text-slate-200">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="hostEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={hostEmail}
                    onChange={(e) => setHostEmail(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="masterPassword" className="text-slate-200">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="masterPassword"
                    type="password"
                    placeholder="Enter your password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
              >
                {isSigningIn ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}