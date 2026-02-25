import { useMemo } from 'react';

/**
 * Transforms raw map_data from settings into district/village option arrays
 * and provides filtered villages based on selected district.
 */
export function useRegionFields(mapData, selectedDistrictId) {
    const districts = useMemo(() => {
        if (!mapData?.districts) return [];
        return Object.entries(mapData.districts).map(([id, name]) => ({
            value: id,
            label: name,
        }));
    }, [mapData]);

    const villages = useMemo(() => {
        if (!mapData?.villages) return [];
        return Object.entries(mapData.villages).map(([id, villageObj]) => ({
            value: id,
            label: villageObj.name,
            districtId: villageObj.parent_district,
        }));
    }, [mapData]);

    const filteredVillages = useMemo(() => {
        if (!selectedDistrictId) return [];
        return villages.filter(v => v.districtId === selectedDistrictId);
    }, [villages, selectedDistrictId]);

    return { districts, villages, filteredVillages };
}

/**
 * Sanitizes phone number input to only allow digits and '+'.
 */
export function sanitizePhoneNumber(value) {
    return value.replace(/[^0-9+]/g, '');
}
