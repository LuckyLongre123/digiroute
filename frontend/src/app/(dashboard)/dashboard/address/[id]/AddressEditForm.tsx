'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateAddressAction } from '@/app/actions/updateAddress';
import { deleteAddressAction } from '@/app/actions/deleteAddress';

interface AddressEditFormProps {
  id: string;
  initialLabel: string;
  initialFloor: string;
  initialUnit: string;
  initialLandmark: string;
}

export default function AddressEditForm({
  id,
  initialLabel,
  initialFloor,
  initialUnit,
  initialLandmark,
}: AddressEditFormProps) {
  const router = useRouter();
  const [label, setLabel] = useState(initialLabel);
  const [floor, setFloor] = useState(initialFloor);
  const [unit, setUnit] = useState(initialUnit);
  const [landmark, setLandmark] = useState(initialLandmark);

  const isUpdatingRef = useRef(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isDeletingRef = useRef(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // CRUCIAL LOGIC GUARD: Early return prevents double-submission
    if (isUpdating || isUpdatingRef.current || isDeleting || isDeletingRef.current) return;

    isUpdatingRef.current = true;
    setIsUpdating(true);

    try {
      const result = await updateAddressAction({
        slugOrId: id,
        label: label.trim(),
        floor: floor.trim(),
        flat: unit.trim(),
        landmark: landmark.trim(),
      });

      if (result.success) {
        toast.success('Address updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update address.');
      }
    } catch (err) {
      console.error('[AddressEditForm] Update error:', err);
      toast.error('Network error while saving changes.');
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    // CRUCIAL LOGIC GUARD: Early return prevents double-submission
    if (isDeleting || isDeletingRef.current || isUpdating || isUpdatingRef.current) return;

    const confirmed = window.confirm('Are you sure you want to permanently delete this micro-address? This action cannot be undone.');
    if (!confirmed) return;

    isDeletingRef.current = true;
    setIsDeleting(true);

    try {
      const result = await deleteAddressAction(id);
      if (result.success) {
        toast.success('Address deleted successfully.');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Failed to delete address.');
        isDeletingRef.current = false;
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('[AddressEditForm] Delete error:', err);
      toast.error('Network error while deleting address.');
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 font-sans">
      {/* Factor 4: Secondary Metadata (Floor, Unit, Landmark) */}
      <div className="bg-card border border-border rounded p-4 space-y-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
          Z-Axis & Building Metadata
        </div>

        <div>
          <label
            htmlFor="address-label"
            className="block text-xs font-medium text-foreground mb-1.5 font-sans"
          >
            Address Label
          </label>
          <input
            id="address-label"
            type="text"
            disabled={isUpdating || isDeleting}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="floor"
              className="block text-xs font-medium text-foreground mb-1.5 font-sans"
            >
              Floor / Level
            </label>
            <input
              id="floor"
              type="text"
              disabled={isUpdating || isDeleting}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label
              htmlFor="unit"
              className="block text-xs font-medium text-foreground mb-1.5 font-sans"
            >
              Flat / Unit No.
            </label>
            <input
              id="unit"
              type="text"
              disabled={isUpdating || isDeleting}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="landmark"
            className="block text-xs font-medium text-foreground mb-1.5 font-sans"
          >
            Visual Landmark
          </label>
          <input
            id="landmark"
            type="text"
            disabled={isUpdating || isDeleting}
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-muted disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Action Buttons: Update & Delete */}
      <div className="pt-2 space-y-3 font-sans">
        <button
          type="submit"
          id="save-address-btn"
          disabled={isUpdating || isDeleting}
          className="w-full h-11 bg-accent text-accent-foreground font-semibold text-sm rounded flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-accent-foreground" />
              <span>Saving changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>

        <button
          type="button"
          id="delete-address-btn"
          onClick={handleDelete}
          disabled={isUpdating || isDeleting}
          className="w-full h-10 border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold rounded flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 font-sans"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              <span>Delete Micro-Address</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
