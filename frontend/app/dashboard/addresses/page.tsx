'use client';

/**
 * Addresses Management Page
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api-client';
import { AUTH_ENDPOINTS } from '@/lib/api-config';
import { PageLoading } from '@/components/ui/LoadingSpinner';
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
  country: 'United States',
  is_default: false,
};

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

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container-custom py-8 max-w-4xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <MapPin className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping Addresses</h1>
            <p className="text-gray-500">Manage your delivery addresses</p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => {
              setFormData(initialFormData);
              setEditingId(null);
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Address
          </button>
        )}
      </div>

      {/* Address Form */}
      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Address' : 'New Address'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label (optional)
              </label>
              <input
                type="text"
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                placeholder="e.g., Home, Office"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="street_address"
                  value={formData.street_address}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apartment, Suite, etc.
                </label>
                <input
                  type="text"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="India">India</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                name="is_default"
                checked={formData.is_default}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <label htmlFor="is_default" className="text-sm text-gray-700">
                Set as default address
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingId ? 'Update Address' : 'Add Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      {addresses.length === 0 && !showForm ? (
        <div className="card p-12 text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No addresses yet</h3>
          <p className="text-gray-500 mt-2">Add your first shipping address</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`card p-4 relative ${
                address.is_default ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {address.is_default && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                  Default
                </span>
              )}

              <h3 className="font-semibold text-gray-900">
                {address.label || `${address.city}, ${address.state}`}
              </h3>
              <div className="text-sm text-gray-600 mt-2">
                <p>{address.street_address}</p>
                {address.apartment && <p>{address.apartment}</p>}
                <p>
                  {address.city}, {address.state} {address.postal_code}
                </p>
                <p>{address.country}</p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 ml-auto"
                  >
                    <Check className="h-4 w-4" />
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
