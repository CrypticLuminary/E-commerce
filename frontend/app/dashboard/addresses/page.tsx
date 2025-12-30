'use client';

/**
 * Addresses Management Page - Minimalist Design
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Plus, Edit2, Trash2, Check, Home, Building } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { AUTH_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import { Address } from '@/lib/types';
import toast from 'react-hot-toast';

interface AddressFormData {
  label: string;
  street_address: string;
  apartment: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const initialFormData: AddressFormData = {
  label: '',
  street_address: '',
  apartment: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Bagmati',
  is_default: false,
};

// Seven Provinces of Nepal
const provinces = [
  'Koshi',
  'Madhesh',
  'Bagmati',
  'Gandaki',
  'Lumbini',
  'Karnali',
  'Sudurpashchim',
];

export default function AddressesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/addresses');
      return;
    }

    fetchAddresses();
  }, [isAuthenticated, authLoading, router]);

  const fetchAddresses = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiRequest<Address[] | { results: Address[] }>(AUTH_ENDPOINTS.ADDRESSES);
      const addresses = Array.isArray(response.data) ? response.data : response.data.results;
      setAddresses(addresses);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        await apiRequest(`${AUTH_ENDPOINTS.ADDRESSES}${editingId}/`, {
          method: 'PATCH',
          data: formData,
        });
        toast.success('Address updated successfully!');
      } else {
        await apiRequest(AUTH_ENDPOINTS.ADDRESSES, {
          method: 'POST',
          data: formData,
        });
        toast.success('Address added successfully!');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      await fetchAddresses();
    } catch (error: any) {
      console.error('Failed to save address:', error);
      toast.error(error.response?.data?.detail || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label || '',
      street_address: address.street_address || address.address_line1 || '',
      apartment: address.apartment || address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await apiRequest(`${AUTH_ENDPOINTS.ADDRESSES}${id}/`, {
        method: 'DELETE',
      });
      toast.success('Address deleted successfully!');
      await fetchAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await apiRequest(`${AUTH_ENDPOINTS.ADDRESSES}${id}/`, {
        method: 'PATCH',
        data: { is_default: true },
      });
      toast.success('Default address updated!');
      await fetchAddresses();
    } catch (error) {
      console.error('Failed to set default:', error);
      toast.error('Failed to update default address');
    }
  };

  const getLabelIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('home')) return Home;
    if (lowerLabel.includes('office') || lowerLabel.includes('work')) return Building;
    return MapPin;
  };

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8 max-w-4xl animate-fade-in">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-100 rounded-xl">
              <MapPin className="h-6 w-6 text-neutral-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Addresses</h1>
              <p className="text-neutral-500">Manage your shipping addresses</p>
            </div>
          </div>

          {!showForm && (
            <Button
              onClick={() => {
                setFormData(initialFormData);
                setEditingId(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          )}
        </div>

        {/* Address Form */}
        {showForm && (
          <Card className="mb-8 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? 'Edit Address' : 'New Address'}
              </CardTitle>
              <CardDescription>
                {editingId ? 'Update your address details' : 'Add a new shipping address'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Label */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Label (optional)
                  </label>
                  <Input
                    type="text"
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    placeholder="e.g., Home, Office, Mom's House"
                  />
                </div>

                {/* Street Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Street Address *
                  </label>
                  <Input
                    type="text"
                    name="street_address"
                    value={formData.street_address}
                    onChange={handleInputChange}
                    required
                    placeholder="123 Main Street"
                  />
                </div>

                {/* Apartment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Apartment, Suite, etc.
                  </label>
                  <Input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    placeholder="Apt 4B"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      City *
                    </label>
                    <Input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      State / Province *
                    </label>
                    <Input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      placeholder="NY"
                    />
                  </div>
                </div>

                {/* Postal Code & Province */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Postal Code *
                    </label>
                    <Input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      required
                      placeholder="44600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Province *
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      className="flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm transition-all duration-200 ease-out ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:border-neutral-300 hover:border-neutral-300"
                    >
                      {provinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Default Address Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, is_default: !prev.is_default }))
                    }
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      formData.is_default ? 'bg-neutral-900' : 'bg-neutral-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        formData.is_default ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                  <label className="text-sm text-neutral-700">
                    Set as default shipping address
                  </label>
                </div>

                <Separator />

                {/* Form Actions */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData(initialFormData);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? 'Saving...'
                      : editingId
                      ? 'Update Address'
                      : 'Add Address'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {addresses.length === 0 && !showForm && (
          <Card className="animate-fade-in-up">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No addresses yet
              </h3>
              <p className="text-neutral-500 mb-6">
                Add your first shipping address to get started
              </p>
              <Button
                onClick={() => {
                  setFormData(initialFormData);
                  setEditingId(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Addresses Grid */}
        {addresses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address, index) => {
              const LabelIcon = getLabelIcon(address.label || '');
              return (
                <Card
                  key={address.id}
                  className={cn(
                    'animate-fade-in-up transition-all duration-300 hover:shadow-md',
                    address.is_default && 'ring-2 ring-neutral-900'
                  )}
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          address.is_default ? 'bg-neutral-900 text-white' : 'bg-neutral-100'
                        )}>
                          <LabelIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-900">
                            {address.label || `${address.city}, ${address.state}`}
                          </h3>
                          {address.is_default && (
                            <Badge variant="secondary" className="mt-1">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address Details */}
                    <div className="text-sm text-neutral-600 space-y-1 mb-4">
                      <p>{address.street_address}</p>
                      {address.apartment && <p>{address.apartment}</p>}
                      <p>
                        {address.city}, {address.state} {address.postal_code}
                      </p>
                      <p className="text-neutral-500">{address.country}</p>
                    </div>

                    <Separator className="my-4" />

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(address)}
                        className="text-neutral-600 hover:text-neutral-900"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        className="text-neutral-600 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      {!address.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          className="ml-auto text-neutral-600 hover:text-neutral-900"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
