import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Building2, MapPin, ChefHat, Loader2 } from 'lucide-react';
import { restaurantSearchService } from '../lib/firebase-service';
import type { RestaurantSearchResult } from '../lib/firebase-service';

interface RestaurantSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRestaurant: (restaurant: RestaurantSearchResult) => void;
  userEmail?: string;
  userRole: 'manager' | 'host';
}

export function RestaurantSearchModal({
  isOpen,
  onClose,
  onSelectRestaurant,
  userEmail,
  userRole
}: RestaurantSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<RestaurantSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

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
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectRestaurant = async (restaurant: RestaurantSearchResult) => {
    // If user is a host, verify their email is authorized
    if (userRole === 'host' && userEmail) {
      const isAuthorized = await restaurantSearchService.verifyHostEmail(
        restaurant.id,
        userEmail
      );

      if (!isAuthorized) {
        setError(`Your email (${userEmail}) is not authorized for this restaurant. Please contact the manager.`);
        return;
      }
    }

    onSelectRestaurant(restaurant);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {userRole === 'manager' ? 'Select Your Restaurant' : 'Find Your Restaurant'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {userRole === 'manager' 
              ? 'Search for your restaurant to access the management portal'
              : 'Search for the restaurant where you work. Your email must be authorized by the manager.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
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
                      {userRole === 'host' && restaurant.authorizedHosts && restaurant.authorizedHosts.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                          {restaurant.authorizedHosts.length} authorized {restaurant.authorizedHosts.length === 1 ? 'host' : 'hosts'}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select →
                    </div>
                  </div>
                </button>
              ))
            ) : searchTerm.trim().length >= 2 && !isSearching ? (
              <div className="text-center py-8 text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No restaurants found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start typing to search restaurants</p>
                <p className="text-sm mt-1">Enter at least 2 characters</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-700">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}