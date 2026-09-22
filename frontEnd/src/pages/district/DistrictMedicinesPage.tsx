import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_MEDICINES, INITIAL_FACILITIES } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { pharmacyApi } from '@/api/pharmacyApi';
import { medicalStoreApi } from '@/api/medicalStoreApi';
import { Facility } from '@/types/facility';
import { MedicineInventoryItem } from '@/types/resources';
import { MedicalStore, MedicalStoreType } from '@/types/medicalStore';
import { INITIAL_MEDICAL_STORES } from '@/mock/medicalStoresData';
import {
  geocodeLocationQuery,
  getCurrentDeviceLocation,
} from '@/services/geocodingService';
import { LocationPickerMap } from '@/components/map/LocationPickerMap';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import {
  Pill,
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  TrendingDown,
  Building2,
  MapPin,
  Sparkles,
  Crosshair,
  Loader2,
  Phone,
  Clock,
  Navigation,
  Percent,
  Edit2,
  Trash2,
} from 'lucide-react';

type MedicineStock = MedicineInventoryItem;

const STORE_LOCATION_PRESETS = [
  { name: 'Gandhinagar Sector 21 Market', lat: 23.2268, lng: 72.6515, area: 'Sector 21 Market', pincode: '382021' },
  { name: 'Gandhinagar Civil Hospital Gate (Sec 12)', lat: 23.2325, lng: 72.6582, area: 'Civil Hospital Campus', pincode: '382012' },
  { name: 'Gandhinagar Sector 16 GIDC', lat: 23.2392, lng: 72.6644, area: 'Sector 16 Market', pincode: '382016' },
  { name: 'Infocity Super Mall Pharmacy', lat: 23.1895, lng: 72.6288, area: 'Infocity', pincode: '382007' },
  { name: 'Kudasan Commercial Hub', lat: 23.1812, lng: 72.6315, area: 'Kudasan', pincode: '382421' },
  { name: 'Kalol Highway PMBJP Kendra', lat: 23.2435, lng: 72.4965, area: 'Kalol Main Road', pincode: '382721' },
  { name: 'Pethapur Community Pharmacy', lat: 23.2721, lng: 72.6688, area: 'Pethapur Main Bazaar', pincode: '382610' },
  { name: 'Mansa APMC Jan Aushadhi', lat: 23.4285, lng: 72.662, area: 'Mansa Bazaar', pincode: '382845' },
  { name: 'Sola GMERS Pharmacy (Ahmedabad)', lat: 23.0782, lng: 72.5185, area: 'Sola SG Highway', pincode: '380060' },
];

export const DistrictMedicinesPage: React.FC = () => {
  const { selectedDistrict } = useLocationContext();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'STORES'>('INVENTORY');

  // Inventory State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showIndentModal, setShowIndentModal] = useState(false);
  const [indentSuccess, setIndentSuccess] = useState<string | null>(null);

  // Dynamic Data State
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [medicines, setMedicines] = useState<MedicineStock[]>(INITIAL_MEDICINES);
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState<string>('ALL');

  // Indent Form State
  const [selectedDrug, setSelectedDrug] = useState(INITIAL_MEDICINES[0]?.medicineName || '');
  const [targetFacility, setTargetFacility] = useState(INITIAL_FACILITIES[0]?.id || '');
  const [indentQty, setIndentQty] = useState('500');

  // Add Medicine Form State
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    medicineName: '',
    genericName: '',
    category: 'Antibiotic',
    batchNumber: '',
    availableQuantity: 500,
    minimumStockThreshold: 100,
    unit: 'Tablets',
    facilityId: 'fac_civil_01',
    expiryDate: '2027-12-31',
    genericPrice: 12,
    brandPrice: 45,
  });

  // Edit & Delete Medicine Form State
  const [showEditMedModal, setShowEditMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicineStock | null>(null);
  const [editMedForm, setEditMedForm] = useState({
    medicineName: '',
    genericName: '',
    category: 'Antibiotic',
    batchNumber: '',
    availableQuantity: 500,
    minimumStockThreshold: 100,
    unit: 'Tablets',
    facilityId: 'fac_civil_01',
    expiryDate: '2027-12-31',
    genericPrice: 12,
    brandPrice: 45,
  });
  const [showDeleteMedDialog, setShowDeleteMedDialog] = useState(false);
  const [deletingMed, setDeletingMed] = useState<MedicineStock | null>(null);
  const [isSavingMed, setIsSavingMed] = useState(false);

  // Medical Stores State
  const [medicalStores, setMedicalStores] = useState<MedicalStore[]>(INITIAL_MEDICAL_STORES);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeTypeFilter, setStoreTypeFilter] = useState('ALL');
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState<string | null>(null);

  // Add Medical Store Form State
  const [newStoreForm, setNewStoreForm] = useState({
    name: '',
    username: '',
    password: 'Pharmacy@123',
    type: 'JAN_AUSHADHI' as MedicalStoreType,
    isJanAushadhi: true,
    licenseNumber: 'GJ-GNR-PMBJP-',
    phone: '',
    whatsappPhone: '',
    timings: '8:00 AM - 10:00 PM (All 7 Days)',
    fullAddress: '',
    area: '',
    pincode: '382021',
    district: selectedDistrict || 'Gandhinagar',
    discountPercentage: 75,
    lat: 23.2268,
    lng: 72.6515,
  });

  // Edit & Delete Medical Store Form State
  const [showEditStoreModal, setShowEditStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<MedicalStore | null>(null);
  const [editStoreForm, setEditStoreForm] = useState({
    name: '',
    type: 'JAN_AUSHADHI' as MedicalStoreType,
    isJanAushadhi: true,
    licenseNumber: '',
    phone: '',
    whatsappPhone: '',
    timings: '8:00 AM - 10:00 PM (All 7 Days)',
    fullAddress: '',
    area: '',
    pincode: '382021',
    district: selectedDistrict || 'Gandhinagar',
    discountPercentage: 75,
    lat: 23.2268,
    lng: 72.6515,
  });
  const [showDeleteStoreDialog, setShowDeleteStoreDialog] = useState(false);
  const [deletingStore, setDeletingStore] = useState<MedicalStore | null>(null);
  const [isSavingStore, setIsSavingStore] = useState(false);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedAddressInfo, setGeocodedAddressInfo] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Load facilities and medicines
  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setFacilities(res.data);
        setTargetFacility(res.data[0].id);
      }
    }).catch(console.warn);
  }, []);

  useEffect(() => {
    const facId = selectedFacilityFilter === 'ALL' ? undefined : selectedFacilityFilter;
    pharmacyApi.getInventory(facId).then((res) => {
      if (res.data && res.data.length > 0) {
        setMedicines(res.data);
        if (!selectedDrug && res.data[0]?.medicineName) {
          setSelectedDrug(res.data[0].medicineName);
        }
      }
    }).catch(console.warn);
  }, [selectedFacilityFilter]);

  // Load medical stores from API
  const loadMedicalStores = () => {
    medicalStoreApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setMedicalStores(res.data);
      }
    }).catch(console.warn);
  };

  useEffect(() => {
    loadMedicalStores();
  }, []);

  // Handle Geocoding from Address Input
  const handleAutoGeocode = async () => {
    const query = `${newStoreForm.fullAddress} ${newStoreForm.area} ${newStoreForm.pincode} ${newStoreForm.district}`.trim();
    if (!query) return;

    setIsGeocoding(true);
    setGeocodedAddressInfo(null);
    try {
      const result = await geocodeLocationQuery(query);
      if (result) {
        setNewStoreForm((prev) => ({
          ...prev,
          lat: result.lat,
          lng: result.lng,
        }));
        setGeocodedAddressInfo(`✓ Matched: ${result.displayName} (${result.lat.toFixed(5)}, ${result.lng.toFixed(5)})`);
      } else {
        setGeocodedAddressInfo('⚠️ Exact street not found in OSM, using district center coordinate');
      }
    } catch (err: any) {
      setGeocodedAddressInfo('⚠️ Geocoding request error');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle Device GPS Fix
  const handleUseDeviceGps = async () => {
    setIsGettingGps(true);
    try {
      const pos = await getCurrentDeviceLocation();
      setNewStoreForm((prev) => ({
        ...prev,
        lat: pos.lat,
        lng: pos.lng,
      }));
      setGeocodedAddressInfo(`✓ Real GPS Locked: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)} (±${pos.accuracy || 8}m)`);
    } catch (err: any) {
      console.warn('GPS error:', err);
      setGeocodedAddressInfo('⚠️ Device GPS permission denied or timed out');
    } finally {
      setIsGettingGps(false);
    }
  };

  // Handle Location Preset Selection
  const handlePresetSelect = (preset: (typeof STORE_LOCATION_PRESETS)[0]) => {
    setNewStoreForm((prev) => ({
      ...prev,
      lat: preset.lat,
      lng: preset.lng,
      area: preset.area,
      pincode: preset.pincode,
      fullAddress: prev.fullAddress || `Near ${preset.name}, ${preset.area}, ${preset.pincode}`,
    }));
    setGeocodedAddressInfo(`✓ Preset Selected: ${preset.name} (${preset.lat}, ${preset.lng})`);
  };

  // Create Medical Store Submit
  const handleCreateMedicalStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreForm.name.trim()) {
      alert('Please enter a store name');
      return;
    }
    if (!newStoreForm.phone.trim()) {
      alert('Please enter contact phone');
      return;
    }
    if (!newStoreForm.fullAddress.trim()) {
      alert('Please enter full address');
      return;
    }

    const trimmedUsername = newStoreForm.username.trim();
    const trimmedPassword = newStoreForm.password.trim();

    if (!trimmedUsername) {
      alert('Pharmacist / Store Manager Login Username / ID is strictly COMPULSORY. Please enter a login username.');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 4) {
      alert('Pharmacist Login Password is strictly COMPULSORY (minimum 4 characters). Please enter a password.');
      return;
    }

    try {
      const lat = Number(newStoreForm.lat) || 23.2268;
      const lng = Number(newStoreForm.lng) || 72.6515;
      const isJanAushadhi = newStoreForm.type === 'JAN_AUSHADHI';

      const payload: any = {
        name: newStoreForm.name.trim(),
        username: trimmedUsername,
        password: trimmedPassword,
        type: newStoreForm.type,
        isJanAushadhi,
        hasLiveApi: true,
        licenseNumber: newStoreForm.licenseNumber.trim() || `GJ-GNR-PMBJP-${Math.floor(1000 + Math.random() * 9000)}`,
        fullAddress: newStoreForm.fullAddress.trim(),
        area: newStoreForm.area.trim() || 'Gandhinagar',
        pincode: newStoreForm.pincode.trim() || '382021',
        district: newStoreForm.district || selectedDistrict || 'Gandhinagar',
        state: 'Gujarat',
        phone: newStoreForm.phone.trim(),
        whatsappPhone: newStoreForm.whatsappPhone ? `91${newStoreForm.whatsappPhone.replace(/\D/g, '')}` : undefined,
        timings: newStoreForm.timings || '8:00 AM - 10:00 PM (All 7 Days)',
        isOpenNow: true,
        rating: 4.8,
        reviewCount: 45,
        discountPercentage: Number(newStoreForm.discountPercentage) || (isJanAushadhi ? 75 : 10),
        coordinates: {
          lat,
          lng,
        },
        stockCatalog: [
          { id: 'med_pcm_650', name: 'Tab. Paracetamol 650mg', genericName: 'Paracetamol IP 650mg', category: 'Antipyretic', dosage: '650 mg', status: 'IN_STOCK', quantityAvailable: 200, genericPrice: 12, brandPrice: 42, unit: 'Strip of 10 Tabs' },
          { id: 'med_panto_40', name: 'Tab. Pantoprazole 40mg', genericName: 'Pantoprazole Gastro-resistant IP 40mg', category: 'Antacid', dosage: '40 mg', status: 'IN_STOCK', quantityAvailable: 120, genericPrice: 16, brandPrice: 65, unit: 'Strip of 10 Tabs' },
          { id: 'med_amlo_5', name: 'Tab. Amlodipine 5mg', genericName: 'Amlodipine Besylate IP 5mg', category: 'Anti-Hypertensive', dosage: '5 mg', status: 'IN_STOCK', quantityAvailable: 150, genericPrice: 9, brandPrice: 38, unit: 'Strip of 10 Tabs' },
          { id: 'med_ors_pack', name: 'Electrolyte ORS Sachet 21.8g', genericName: 'Oral Rehydration Salts WHO Formula', category: 'Electrolyte', dosage: '21.8 g', status: 'IN_STOCK', quantityAvailable: 300, genericPrice: 5, brandPrice: 22, unit: '1 Sachet' },
        ],
      };

      const res = await medicalStoreApi.create(payload);
      if (res && res.data) {
        const createdStore = res.data;
        setMedicalStores((prev) => [createdStore, ...prev.filter((s) => s.id !== createdStore.id)]);
        setStoreSuccess(`Medical store "${createdStore.name || payload.name}" successfully registered! Dispensary Login Username: "${trimmedUsername}" | Password: "${trimmedPassword}"`);
        setShowAddStoreModal(false);
        setNewStoreForm({
          name: '',
          username: '',
          password: '',
          type: 'JAN_AUSHADHI' as MedicalStoreType,
          isJanAushadhi: true,
          licenseNumber: 'GJ-GNR-PMBJP-',
          phone: '',
          whatsappPhone: '',
          timings: '8:00 AM - 10:00 PM (All 7 Days)',
          fullAddress: '',
          area: '',
          pincode: '382021',
          district: selectedDistrict || 'Gandhinagar',
          discountPercentage: 75,
          lat: 23.2268,
          lng: 72.6515,
        });
        setTimeout(() => setStoreSuccess(null), 10000);
      }
    } catch (err: any) {
      alert(`Error registering medical store: ${err?.message || 'Server error'}`);
    }
  };

  // Add Medicine to EML submit
  const handleAddMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedForm.medicineName.trim()) {
      alert('Please enter medicine name');
      return;
    }

    try {
      const res = await pharmacyApi.addMedicine({
        medicineName: newMedForm.medicineName.trim(),
        genericName: newMedForm.genericName.trim() || newMedForm.medicineName.trim(),
        category: newMedForm.category,
        batchNumber: newMedForm.batchNumber.trim() || `BT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        availableQuantity: Number(newMedForm.availableQuantity) || 0,
        minimumStockThreshold: Number(newMedForm.minimumStockThreshold) || 50,
        unit: newMedForm.unit,
        facilityId: newMedForm.facilityId,
        expiryDate: newMedForm.expiryDate || '2027-12-31',
      });

      if (res && res.data) {
        setMedicines((prev) => [res.data, ...prev.filter((m) => m.id !== res.data.id)]);
        setIndentSuccess(`Medicine "${res.data.medicineName}" added successfully to hospital inventory and synced across patient search!`);
        setShowAddMedModal(false);
        setNewMedForm({
          medicineName: '',
          genericName: '',
          category: 'Antibiotic',
          batchNumber: '',
          availableQuantity: 500,
          minimumStockThreshold: 100,
          unit: 'Tablets',
          facilityId: 'fac_civil_01',
          expiryDate: '2027-12-31',
          genericPrice: 12,
          brandPrice: 45,
        });
        setTimeout(() => setIndentSuccess(null), 7000);

        // Reload medical stores to get updated catalog
        loadMedicalStores();
      }
    } catch (err: any) {
      alert(`Error adding medicine: ${err?.message || 'Server error'}`);
    }
  };

  // Handle Opening Edit Medical Store
  const handleOpenEditStore = (store: MedicalStore) => {
    setEditingStore(store);
    setEditStoreForm({
      name: store.name || '',
      type: store.type || 'JAN_AUSHADHI',
      isJanAushadhi: !!store.isJanAushadhi,
      licenseNumber: store.licenseNumber || '',
      phone: store.phone || '',
      whatsappPhone: store.whatsappPhone || '',
      timings: store.timings || '8:00 AM - 10:00 PM (All 7 Days)',
      fullAddress: store.fullAddress || '',
      area: store.area || '',
      pincode: store.pincode || '382021',
      district: store.district || selectedDistrict || 'Gandhinagar',
      discountPercentage: store.discountPercentage !== undefined ? store.discountPercentage : 75,
      lat: store.coordinates?.lat || 23.2268,
      lng: store.coordinates?.lng || 72.6515,
    });
    setShowEditStoreModal(true);
  };

  // Submit Edit Medical Store
  const handleEditStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    setIsSavingStore(true);
    try {
      const payload: Partial<MedicalStore> = {
        name: editStoreForm.name,
        type: editStoreForm.type,
        isJanAushadhi: editStoreForm.type === 'JAN_AUSHADHI',
        licenseNumber: editStoreForm.licenseNumber,
        phone: editStoreForm.phone,
        whatsappPhone: editStoreForm.whatsappPhone,
        timings: editStoreForm.timings,
        fullAddress: editStoreForm.fullAddress,
        area: editStoreForm.area,
        pincode: editStoreForm.pincode,
        district: editStoreForm.district,
        discountPercentage: Number(editStoreForm.discountPercentage) || 0,
        coordinates: {
          lat: Number(editStoreForm.lat),
          lng: Number(editStoreForm.lng),
        },
      };

      const res = await medicalStoreApi.update(editingStore.id, payload);
      if (res && res.data) {
        setMedicalStores((prev) =>
          prev.map((s) => (s.id === editingStore.id ? { ...s, ...res.data } : s))
        );
        setStoreSuccess(`Medical Store "${editStoreForm.name}" updated successfully!`);
        setShowEditStoreModal(false);
        setEditingStore(null);
        setTimeout(() => setStoreSuccess(null), 5000);
      }
    } catch (err: any) {
      alert(`Error updating medical store: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingStore(false);
    }
  };

  // Handle Opening Delete Store
  const handleOpenDeleteStore = (store: MedicalStore) => {
    setDeletingStore(store);
    setShowDeleteStoreDialog(true);
  };

  // Confirm Delete Store
  const handleDeleteStoreConfirm = async () => {
    if (!deletingStore) return;
    setIsSavingStore(true);
    try {
      await medicalStoreApi.delete(deletingStore.id);
      setMedicalStores((prev) => prev.filter((s) => s.id !== deletingStore.id));
      setStoreSuccess(`Medical Store "${deletingStore.name}" removed successfully.`);
      setShowDeleteStoreDialog(false);
      setDeletingStore(null);
      setTimeout(() => setStoreSuccess(null), 5000);
    } catch (err: any) {
      alert(`Error deleting medical store: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingStore(false);
    }
  };

  // Handle Opening Edit Medicine
  const handleOpenEditMed = (med: MedicineInventoryItem) => {
    setEditingMed(med);
    setEditMedForm({
      medicineName: med.medicineName || '',
      genericName: med.genericName || med.medicineName || '',
      category: med.category || 'Antibiotic',
      batchNumber: med.batchNumber || '',
      availableQuantity: med.availableQuantity || 0,
      minimumStockThreshold: med.minimumStockThreshold || 20,
      unit: med.unit || 'Tablets',
      facilityId: med.facilityId || 'fac_civil_01',
      expiryDate: med.expiryDate || '2027-12-31',
      genericPrice: (med as any).genericPrice || 12,
      brandPrice: (med as any).brandPrice || 45,
    });
    setShowEditMedModal(true);
  };

  // Submit Edit Medicine
  const handleEditMedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;
    setIsSavingMed(true);
    try {
      const payload: Partial<MedicineInventoryItem> = {
        medicineName: editMedForm.medicineName.trim(),
        genericName: editMedForm.genericName.trim() || editMedForm.medicineName.trim(),
        category: editMedForm.category,
        batchNumber: editMedForm.batchNumber.trim(),
        availableQuantity: Number(editMedForm.availableQuantity) || 0,
        minimumStockThreshold: Number(editMedForm.minimumStockThreshold) || 20,
        unit: editMedForm.unit,
        facilityId: editMedForm.facilityId,
        expiryDate: editMedForm.expiryDate,
      };

      const res = await pharmacyApi.updateMedicine(editingMed.id, payload);
      if (res && res.data) {
        setMedicines((prev) =>
          prev.map((m) => (m.id === editingMed.id ? { ...m, ...res.data } : m))
        );
        setIndentSuccess(`Medicine "${res.data.medicineName}" updated successfully!`);
        setShowEditMedModal(false);
        setEditingMed(null);
        setTimeout(() => setIndentSuccess(null), 5000);
        loadMedicalStores();
      }
    } catch (err: any) {
      alert(`Error updating medicine: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingMed(false);
    }
  };

  // Handle Opening Delete Medicine
  const handleOpenDeleteMed = (med: MedicineInventoryItem) => {
    setDeletingMed(med);
    setShowDeleteMedDialog(true);
  };

  // Confirm Delete Medicine
  const handleDeleteMedConfirm = async () => {
    if (!deletingMed) return;
    setIsSavingMed(true);
    try {
      await pharmacyApi.deleteMedicine(deletingMed.id);
      setMedicines((prev) => prev.filter((m) => m.id !== deletingMed.id));
      setIndentSuccess(`Medicine "${deletingMed.medicineName}" removed successfully.`);
      setShowDeleteMedDialog(false);
      setDeletingMed(null);
      setTimeout(() => setIndentSuccess(null), 5000);
      loadMedicalStores();
    } catch (err: any) {
      alert(`Error deleting medicine: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingMed(false);
    }
  };

  // Categories list
  const categories = ['ALL', 'Antibiotic', 'Cardiovascular', 'Antidiabetic', 'Analgesic', 'Emergency'];

  // Filter medicines
  const filteredMedicines = medicines.filter((med) => {
    if (!med) return false;
    const name = med.medicineName || '';
    const cat = med.category || '';
    const batch = med.batchNumber || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || cat.toLowerCase().includes(categoryFilter.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'LOW') matchesStatus = med.status === 'LOW_STOCK';
    if (statusFilter === 'CRITICAL') matchesStatus = med.status === 'OUT_OF_STOCK';
    if (statusFilter === 'ADEQUATE') matchesStatus = med.status === 'IN_STOCK';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter medical stores
  const filteredStores = medicalStores.filter((store) => {
    if (!store) return false;
    const name = store.name || '';
    const area = store.area || '';
    const fullAddress = store.fullAddress || '';
    const license = store.licenseNumber || '';
    const timings = store.timings || '';

    const matchesSearch =
      name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      area.toLowerCase().includes(storeSearch.toLowerCase()) ||
      fullAddress.toLowerCase().includes(storeSearch.toLowerCase()) ||
      license.toLowerCase().includes(storeSearch.toLowerCase());

    const matchesType =
      storeTypeFilter === 'ALL' ||
      (storeTypeFilter === 'JAN_AUSHADHI' && store.isJanAushadhi) ||
      (storeTypeFilter === '24X7' && timings.includes('24')) ||
      (storeTypeFilter === 'HOSPITAL' && store.type === 'HOSPITAL_PHARMACY');

    return matchesSearch && matchesType;
  });

  // KPIs
  const totalItems = medicines.length;
  const criticalStockouts = medicines.filter((m) => m.status === 'OUT_OF_STOCK').length;
  const lowStockCount = medicines.filter((m) => m.status === 'LOW_STOCK').length;
  const inStockCount = medicines.filter((m) => m.status === 'IN_STOCK').length;

  const totalRegisteredStores = medicalStores.length;
  const totalJanAushadhiStores = medicalStores.filter((s) => s.isJanAushadhi).length;

  const handleCreateIndent = (e: React.FormEvent) => {
    e.preventDefault();
    setIndentSuccess(`Emergency indent for ${indentQty} units of ${selectedDrug} submitted to Gujarat Medical Services Corporation (GMSCL).`);
    setShowIndentModal(false);

    setTimeout(() => {
      setIndentSuccess(null);
    }, 6000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ================================================== */}
      {/* PAGE HEADER */}
      {/* ================================================== */}
      <PageHeader
        title="District Medicine Inventory & Pharmacy Governance"
        subtitle={`Track EML essential drugs, warehouse indents, and register PMBJP Jan Aushadhi Kendras & Medical Stores across ${selectedDistrict}.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Medicines & Pharmacies' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddMedModal(true)}
              size="sm"
              className="gap-2 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Medicine Formulation</span>
            </Button>
            <Button
              onClick={() => setShowAddStoreModal(true)}
              size="sm"
              className="gap-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Register Medical Store / Jan Aushadhi</span>
            </Button>
            <Button
              onClick={() => setShowIndentModal(true)}
              size="sm"
              variant="outline"
              className="gap-2 text-xs font-semibold border-teal-700 text-teal-800 hover:bg-teal-50"
            >
              <Package className="h-4 w-4" />
              <span>Raise Drug Indent</span>
            </Button>
          </div>
        }
      />

      {/* Success Notifications */}
      {storeSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3 text-xs text-emerald-950 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
          <p className="font-bold">{storeSuccess}</p>
        </div>
      )}

      {indentSuccess && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-300 flex items-center gap-3 text-xs text-teal-950 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-teal-700 shrink-0" />
          <p className="font-bold">{indentSuccess}</p>
        </div>
      )}

      {/* 3 Decision-Driving KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monitored EML Drugs</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Pill className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalItems} Items</p>
          <span className="text-[11px] text-teal-700 font-medium">{inStockCount} drugs in adequate supply</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Registered Medical Stores</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalRegisteredStores} Stores</p>
          <span className="text-[11px] text-emerald-700 font-medium">{totalJanAushadhiStores} PMBJP Jan Aushadhi Kendras</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Low Stock Buffer</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{lowStockCount} Items</p>
          <span className="text-[11px] text-amber-700 font-medium">Reorder threshold reached</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Critical Stockouts</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{criticalStockouts} Items</p>
          <span className="text-[11px] text-rose-700 font-medium">Immediate warehouse indent needed</span>
        </Card>
      </div>

      {/* ================================================== */}
      {/* 2 MAIN TABS: INVENTORY VS REGISTERED MEDICAL STORES */}
      {/* ================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('INVENTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'INVENTORY'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Pill className="h-4 w-4" />
          <span>Hospital EML Drug Inventory ({medicines.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STORES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'STORES'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Registered Medical Stores & Jan Aushadhi ({medicalStores.length})</span>
        </button>
      </div>

      {/* ================================================== */}
      {/* TAB 1: EML MEDICINE INVENTORY */}
      {/* ================================================== */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-4">
          <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by drug name, batch, or therapeutic class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedFacilityFilter}
                  onChange={(e) => setSelectedFacilityFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-hidden"
                >
                  <option value="ALL">All District Facilities</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold shadow-2xs focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Stock Statuses</option>
                  <option value="ADEQUATE">Adequate Stock Only</option>
                  <option value="LOW">Low Stock Warning</option>
                  <option value="CRITICAL">Stockouts Only</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' ? 'All Classes' : cat}
                </button>
              ))}
            </div>
          </Card>

          {/* Medicines Inventory Table */}
          <Card className="p-5 bg-white border-slate-200 shadow-xs rounded-2xl space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                    <th className="py-2.5 px-3">Medicine & Dosage</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Available Stock</th>
                    <th className="py-2.5 px-3">Minimum Safety Limit</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMedicines.map((med) => {
                    const isCritical = med.status === 'OUT_OF_STOCK';
                    const isLow = med.status === 'LOW_STOCK';

                    return (
                      <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{med.medicineName}</span>
                          <span className="text-[11px] text-slate-400">Unit: {med.unit}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {med.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${isCritical ? 'text-rose-600 font-black' : isLow ? 'text-amber-600 font-bold' : 'text-slate-900'}`}>
                            {med.availableQuantity} {med.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{med.minimumStockThreshold} {med.unit}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isCritical ? 'Stockout' : isLow ? 'Low Stock' : 'Adequate'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDrug(med.medicineName);
                                setShowIndentModal(true);
                              }}
                              className="text-xs font-semibold h-8"
                            >
                              Reorder
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditMed(med)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg cursor-pointer"
                              title="Edit Formulation / Stock"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDeleteMed(med)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete Formulation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ================================================== */}
      {/* TAB 2: REGISTERED MEDICAL STORES & PMBJP KENDRAS */}
      {/* ================================================== */}
      {activeTab === 'STORES' && (
        <div className="space-y-4">
          <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stores by name, area, license number, or address..."
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={storeTypeFilter}
                  onChange={(e) => setStoreTypeFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 font-bold shadow-2xs focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Store Types</option>
                  <option value="JAN_AUSHADHI">🏛️ Govt Jan Aushadhi (PMBJP)</option>
                  <option value="24X7">⏰ 24x7 Emergency Chemist</option>
                  <option value="HOSPITAL">🏥 Hospital OPD Pharmacy</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Stores List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStores.map((store) => (
              <Card
                key={store.id}
                className={`rounded-2xl border p-4 space-y-3 shadow-xs transition-all ${
                  store.isJanAushadhi
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {store.isJanAushadhi ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-800 text-white text-[10px] font-black">
                          🏛️ PMBJP Jan Aushadhi
                        </span>
                      ) : store.type === 'HOSPITAL_PHARMACY' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-700 text-white text-[10px] font-black">
                          🏥 Hospital Pharmacy
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-300">
                          Private Pharmacy
                        </span>
                      )}

                      {store.discountPercentage && store.discountPercentage > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold flex items-center gap-0.5">
                          <Percent className="h-3 w-3" />
                          <span>{store.discountPercentage}% Discount</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-950 text-sm mt-1.5">{store.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{store.fullAddress}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditStore(store)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                      title="Edit Medical Store"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDeleteStore(store)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Medical Store"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* GPS Coordinates Badge */}
                <div className="p-2 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="font-mono text-[11px] text-slate-700">
                    📍 Lat: <span className="font-bold text-slate-900">{store.coordinates?.lat || 23.2268}</span>, Lng:{' '}
                    <span className="font-bold text-slate-900">{store.coordinates?.lng || 72.6515}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">License: {store.licenseNumber}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{store.timings}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{store.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${store.name} ${store.fullAddress}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-bold border-slate-300 hover:bg-slate-50 gap-1.5"
                    >
                      <Navigation className="h-3.5 w-3.5 text-teal-700" />
                      <span>View on Google Maps</span>
                    </Button>
                  </a>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditStore(store)}
                    className="text-xs font-bold border-slate-300 hover:bg-slate-50 gap-1 px-3"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                    <span>Edit</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL: REGISTER NEW MEDICAL STORE WITH PRECISE GPS */}
      {/* ================================================== */}
      {showAddStoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <Card className="w-full max-w-3xl bg-white border-slate-200 shadow-2xl space-y-4 rounded-3xl overflow-hidden my-auto">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Building2 className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">Register New Medical Store / Jan Aushadhi</h3>
                  <p className="text-xs text-emerald-200">
                    Matches exact street GPS coordinates so nearest patients can find it accurately
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStoreModal(false)}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedicalStore} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Row 1: Store Name & Store Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Store Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pradhan Mantri Jan Aushadhi Kendra (PMBJP) Sector 21"
                    value={newStoreForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewStoreForm((prev) => ({
                        ...prev,
                        name: val,
                        username: (!prev.username || prev.username.startsWith('pharm_'))
                          ? (val.trim() ? `pharm_${val.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '')
                          : prev.username,
                      }));
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Store Category</label>
                  <select
                    value={newStoreForm.type}
                    onChange={(e) =>
                      setNewStoreForm({
                        ...newStoreForm,
                        type: e.target.value as MedicalStoreType,
                        isJanAushadhi: e.target.value === 'JAN_AUSHADHI',
                        discountPercentage: e.target.value === 'JAN_AUSHADHI' ? 75 : 10,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-emerald-700 outline-none"
                  >
                    <option value="JAN_AUSHADHI">🏛️ Govt Jan Aushadhi Kendra (PMBJP - 80% Off)</option>
                    <option value="24X7_EMERGENCY">⏰ 24x7 Emergency Private Chemist</option>
                    <option value="HOSPITAL_PHARMACY">🏥 Hospital Attached OPD Dispensary (Free)</option>
                    <option value="PRIVATE_CHEMIST">🏬 Traditional Private Pharmacy</option>
                  </select>
                </div>
              </div>

              {/* Row 2: License Number, Phone, WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Drug License / PMBJP Code</label>
                  <input
                    type="text"
                    placeholder="e.g. GJ-GNR-PMBJP-0182"
                    value={newStoreForm.licenseNumber}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, licenseNumber: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9825012345"
                    value={newStoreForm.phone}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">WhatsApp Phone (Stock Inquiries)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9825012345"
                    value={newStoreForm.whatsappPhone}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, whatsappPhone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Address & Area */}
              <div className="space-y-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Full Physical Address & Street <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shop 14, Shopping Centre, Near SBI, Sector 21, Gandhinagar"
                    value={newStoreForm.fullAddress}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, fullAddress: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Area / Locality</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 21 Market"
                      value={newStoreForm.area}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, area: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="e.g. 382021"
                      value={newStoreForm.pincode}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, pincode: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Operating Timings</label>
                    <input
                      type="text"
                      placeholder="e.g. 8:00 AM - 10:00 PM (All 7 Days)"
                      value={newStoreForm.timings}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, timings: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ================================================== */}
              {/* 🎯 PRECISE GEO-COORDINATES & AUTO-MATCH TOOLS */}
              {/* ================================================== */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/60 border-2 border-emerald-300 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-800" />
                    <span className="font-extrabold text-emerald-950 text-xs">
                      Precise GPS Coordinates (Latitude & Longitude)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Auto-Match Address Button */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAutoGeocode}
                      disabled={isGeocoding || !newStoreForm.fullAddress}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-1"
                    >
                      {isGeocoding ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-amber-300" />
                      )}
                      <span>🎯 Auto-Match Address GPS</span>
                    </Button>

                    {/* Use My GPS Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleUseDeviceGps}
                      disabled={isGettingGps}
                      className="bg-white border-emerald-300 text-emerald-900 font-bold text-xs rounded-xl shadow-2xs cursor-pointer gap-1"
                    >
                      {isGettingGps ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Crosshair className="h-3 w-3 text-emerald-700" />
                      )}
                      <span>📍 Use My GPS</span>
                    </Button>

                    {/* Toggle Map Marker Drop */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className="bg-white border-emerald-300 text-emerald-900 font-bold text-xs rounded-xl shadow-2xs cursor-pointer gap-1"
                    >
                      <MapPin className="h-3 w-3 text-emerald-700" />
                      <span>{showMapPicker ? 'Hide Map' : '🗺️ Drop Pin on Map'}</span>
                    </Button>
                  </div>
                </div>

                {/* Geocode Feedback */}
                {geocodedAddressInfo && (
                  <div className="p-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-medium text-[11px]">
                    {geocodedAddressInfo}
                  </div>
                )}

                {/* Coordinate Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">Latitude (Decimal)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newStoreForm.lat}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, lat: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold shadow-2xs focus:border-emerald-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">Longitude (Decimal)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newStoreForm.lng}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, lng: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold shadow-2xs focus:border-emerald-700 outline-none"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">Quick Location Presets</label>
                    <select
                      onChange={(e) => {
                        const found = STORE_LOCATION_PRESETS.find((p) => p.name === e.target.value);
                        if (found) handlePresetSelect(found);
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs shadow-2xs focus:border-emerald-700 outline-none cursor-pointer"
                    >
                      <option value="">Select Known Hub...</option>
                      {STORE_LOCATION_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Embedded Map Picker */}
                {showMapPicker && (
                  <div className="pt-2">
                    <p className="text-[11px] text-emerald-950 font-bold mb-1.5">
                      📍 Click anywhere on the map or drag the pin directly onto the pharmacy entrance:
                    </p>
                    <LocationPickerMap
                      lat={newStoreForm.lat}
                      lng={newStoreForm.lng}
                      onChangeLocation={(lat: number, lng: number) => {
                        setNewStoreForm((prev) => ({ ...prev, lat, lng }));
                        setGeocodedAddressInfo(`✓ Map Pin Placed: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                      }}
                      height="220px"
                    />
                  </div>
                )}
                {/* Pharmacist / Manager Login Credentials */}
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      🔐 Pharmacist Login Credentials <span className="text-rose-600 font-extrabold">* (Compulsory)</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">Mandatory for pharmacy portal sign in</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Dispensary Username / ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={newStoreForm.name.trim() ? `pharm_${newStoreForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'e.g. pharm_sector21'}
                        value={newStoreForm.username}
                        onChange={(e) => setNewStoreForm({ ...newStoreForm, username: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs shadow-2xs focus:border-emerald-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Dispensary Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Pharmacy@123"
                        value={newStoreForm.password}
                        onChange={(e) => setNewStoreForm({ ...newStoreForm, password: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs shadow-2xs focus:border-emerald-700 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddStoreModal(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs cursor-pointer px-5"
                >
                  Register Store & Save Coordinates
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ================================================== */}
      {/* EMERGENCY INDENT MODAL */}
      {/* ================================================== */}
      {showIndentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl sm:max-w-3xl p-6 sm:p-8 bg-white border-slate-200 shadow-xl space-y-4 rounded-3xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
                <Package className="h-5 w-5" />
                <h3>Raise Emergency Drug Indent</h3>
              </div>
              <button
                onClick={() => setShowIndentModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIndent} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Drug / Formulation</label>
                <select
                  value={selectedDrug}
                  onChange={(e) => setSelectedDrug(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.medicineName}>
                      {m.medicineName} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivery Destination</label>
                <select
                  value={targetFacility}
                  onChange={(e) => setTargetFacility(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700"
                >
                  <option value="central_warehouse">Gandhinagar District Drug Warehouse</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Indent Quantity</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={indentQty}
                    onChange={(e) => setIndentQty(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Procurement Track</label>
                  <select className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700">
                    <option>GMSCL Fast-Track (48h)</option>
                    <option>Local Emergency Purchase</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIndentModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  Submit Indent
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ================================================== */}
      {/* ADD MEDICINE FORMULATION MODAL */}
      {/* ================================================== */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl space-y-4 rounded-3xl overflow-hidden my-auto">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Pill className="h-5 w-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">Add Medicine Formulation</h3>
                  <p className="text-xs text-teal-200">
                    Registers into hospital formulary and automatically syncs across the patient medical search
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMedModal(false)}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Medicine Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 650mg"
                    value={newMedForm.medicineName}
                    onChange={(e) => setNewMedForm({ ...newMedForm, medicineName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Generic Salt Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol IP"
                    value={newMedForm.genericName}
                    onChange={(e) => setNewMedForm({ ...newMedForm, genericName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Category / Therapeutic Class</label>
                  <select
                    value={newMedForm.category}
                    onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-teal-700 outline-none"
                  >
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Analgesic">Analgesic / Antipyretic</option>
                    <option value="Antacid">Antacid / PPI</option>
                    <option value="Emergency">Emergency Life-Saving</option>
                    <option value="General">General EML</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BT-2026-880"
                    value={newMedForm.batchNumber}
                    onChange={(e) => setNewMedForm({ ...newMedForm, batchNumber: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="e.g. Strip of 10 Tabs"
                    value={newMedForm.unit}
                    onChange={(e) => setNewMedForm({ ...newMedForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMedForm.availableQuantity}
                    onChange={(e) => setNewMedForm({ ...newMedForm, availableQuantity: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Low Stock Warning</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMedForm.minimumStockThreshold}
                    onChange={(e) => setNewMedForm({ ...newMedForm, minimumStockThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Generic Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMedForm.genericPrice}
                    onChange={(e) => setNewMedForm({ ...newMedForm, genericPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Brand MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMedForm.brandPrice}
                    onChange={(e) => setNewMedForm({ ...newMedForm, brandPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Assign to Hospital Facility</label>
                <select
                  value={newMedForm.facilityId}
                  onChange={(e) => setNewMedForm({ ...newMedForm, facilityId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-teal-700 outline-none"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMedModal(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs cursor-pointer px-5"
                >
                  Save Medicine & Sync
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL: EDIT MEDICAL STORE */}
      {/* ================================================== */}
      {showEditStoreModal && editingStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <Card className="w-full max-w-3xl bg-white border-slate-200 shadow-2xl space-y-4 rounded-3xl overflow-hidden my-auto">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Edit2 className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">Edit Medical Store / Jan Aushadhi</h3>
                  <p className="text-xs text-emerald-200">
                    Update store metadata, operating hours, and verified geolocation coordinates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditStoreModal(false);
                  setEditingStore(null);
                }}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditStoreSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Store Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editStoreForm.name}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, name: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Store Category</label>
                  <select
                    value={editStoreForm.type}
                    onChange={(e) =>
                      setEditStoreForm({
                        ...editStoreForm,
                        type: e.target.value as MedicalStoreType,
                        isJanAushadhi: e.target.value === 'JAN_AUSHADHI',
                        discountPercentage: e.target.value === 'JAN_AUSHADHI' ? 75 : editStoreForm.discountPercentage,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-emerald-700 outline-none"
                  >
                    <option value="JAN_AUSHADHI">🏛️ Govt Jan Aushadhi Kendra (PMBJP - 80% Off)</option>
                    <option value="24X7_EMERGENCY">⏰ 24x7 Emergency Private Chemist</option>
                    <option value="HOSPITAL_PHARMACY">🏥 Hospital Attached OPD Dispensary (Free)</option>
                    <option value="PRIVATE_CHEMIST">🏬 Traditional Private Pharmacy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Drug License / PMBJP Code</label>
                  <input
                    type="text"
                    value={editStoreForm.licenseNumber}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, licenseNumber: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Direct Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editStoreForm.phone}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">WhatsApp Phone (For Inquiries)</label>
                  <input
                    type="tel"
                    value={editStoreForm.whatsappPhone}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, whatsappPhone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={editStoreForm.timings}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, timings: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Discount % Offered</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editStoreForm.discountPercentage}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, discountPercentage: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Full Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={editStoreForm.fullAddress}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, fullAddress: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={editStoreForm.area}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, area: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={editStoreForm.pincode}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, pincode: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">District</label>
                  <input
                    type="text"
                    value={editStoreForm.district}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, district: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-emerald-700 outline-none"
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    Store Geolocation Coordinates (WGS84)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editStoreForm.lat}
                      onChange={(e) => setEditStoreForm({ ...editStoreForm, lat: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editStoreForm.lng}
                      onChange={(e) => setEditStoreForm({ ...editStoreForm, lng: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEditStoreModal(false);
                    setEditingStore(null);
                  }}
                  className="text-xs rounded-xl"
                  disabled={isSavingStore}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingStore}
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs cursor-pointer px-5"
                >
                  {isSavingStore ? 'Saving Changes...' : 'Update Medical Store'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ================================================== */}
      {/* DIALOG: DELETE MEDICAL STORE */}
      {/* ================================================== */}
      <Dialog open={showDeleteStoreDialog} onOpenChange={setShowDeleteStoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">
                  Delete Medical Store
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  This will remove the store and its stock from the live directory.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deletingStore && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
              <div className="font-extrabold text-rose-950 text-sm">{deletingStore.name}</div>
              <div className="text-rose-800 font-medium">{deletingStore.fullAddress}</div>
              <div className="text-[11px] text-rose-600 font-mono">License: {deletingStore.licenseNumber || 'N/A'}</div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDeleteStoreDialog(false);
                setDeletingStore(null);
              }}
              disabled={isSavingStore}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteStoreConfirm}
              disabled={isSavingStore}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
            >
              {isSavingStore ? 'Deleting...' : 'Delete Store'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================== */}
      {/* MODAL: EDIT MEDICINE FORMULATION */}
      {/* ================================================== */}
      {showEditMedModal && editingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl space-y-4 rounded-3xl overflow-hidden my-auto">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Edit2 className="h-5 w-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">Edit Medicine Formulation</h3>
                  <p className="text-xs text-teal-200">
                    Update formulary details, stock levels, safety threshold, and hospital assignment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditMedModal(false);
                  setEditingMed(null);
                }}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditMedSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Medicine Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editMedForm.medicineName}
                    onChange={(e) => setEditMedForm({ ...editMedForm, medicineName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Generic Salt Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editMedForm.genericName}
                    onChange={(e) => setEditMedForm({ ...editMedForm, genericName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Category / Therapeutic Class</label>
                  <select
                    value={editMedForm.category}
                    onChange={(e) => setEditMedForm({ ...editMedForm, category: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-teal-700 outline-none"
                  >
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Analgesic">Analgesic / Antipyretic</option>
                    <option value="Antacid">Antacid / PPI</option>
                    <option value="Emergency">Emergency Life-Saving</option>
                    <option value="General">General EML</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={editMedForm.batchNumber}
                    onChange={(e) => setEditMedForm({ ...editMedForm, batchNumber: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={editMedForm.unit}
                    onChange={(e) => setEditMedForm({ ...editMedForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Available Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editMedForm.availableQuantity}
                    onChange={(e) => setEditMedForm({ ...editMedForm, availableQuantity: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Low Stock Warning Limit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editMedForm.minimumStockThreshold}
                    onChange={(e) => setEditMedForm({ ...editMedForm, minimumStockThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editMedForm.expiryDate}
                    onChange={(e) => setEditMedForm({ ...editMedForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-teal-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Assigned Hospital Facility</label>
                <select
                  value={editMedForm.facilityId}
                  onChange={(e) => setEditMedForm({ ...editMedForm, facilityId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold shadow-2xs focus:border-teal-700 outline-none"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEditMedModal(false);
                    setEditingMed(null);
                  }}
                  className="text-xs rounded-xl"
                  disabled={isSavingMed}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingMed}
                  className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs cursor-pointer px-5"
                >
                  {isSavingMed ? 'Updating...' : 'Update Medicine & Sync'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ================================================== */}
      {/* DIALOG: DELETE MEDICINE FORMULATION */}
      {/* ================================================== */}
      <Dialog open={showDeleteMedDialog} onOpenChange={setShowDeleteMedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">
                  Delete Medicine Formulation
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  This will remove the medicine from the inventory formulary and sync catalogs.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deletingMed && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
              <div className="font-extrabold text-rose-950 text-sm">{deletingMed.medicineName}</div>
              <div className="text-rose-800 font-medium">Category: {deletingMed.category}</div>
              <div className="text-[11px] text-rose-600 font-mono">
                Batch: {deletingMed.batchNumber || 'N/A'} | Stock: {deletingMed.availableQuantity} {deletingMed.unit}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDeleteMedDialog(false);
                setDeletingMed(null);
              }}
              disabled={isSavingMed}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteMedConfirm}
              disabled={isSavingMed}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
            >
              {isSavingMed ? 'Deleting...' : 'Delete Medicine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
