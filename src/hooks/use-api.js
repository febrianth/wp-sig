import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const WP_DATA = (typeof sig_plugin_data !== 'undefined')
    ? sig_plugin_data
    : { api_url: '', nonce: '' };

const headers = { 'X-WP-Nonce': WP_DATA.nonce };

async function apiFetch(endpoint, options = {}) {
    const res = await fetch(WP_DATA.api_url + endpoint, {
        headers: { ...headers, ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || body?.error || `Request failed: ${res.status}`);
    }
    return res.json();
}

export function useSettings() {
    return useQuery({
        queryKey: ['settings'],
        queryFn: () => apiFetch('settings'),
    });
}

export function useEvents() {
    return useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const data = await apiFetch('events');
            return Object.values(data);
        },
    });
}

export function useMemberSummary(eventId) {
    return useQuery({
        queryKey: ['member-summary', eventId],
        queryFn: () => {
            const params = new URLSearchParams();
            if (eventId && eventId !== 'all') params.set('event_id', eventId);
            const qs = params.toString();
            return apiFetch(`members/summary${qs ? '?' + qs : ''}`);
        },
    });
}

export function useMembers(filters) {
    const { page, perPage = 10, search, eventId, view } = filters;

    return useQuery({
        queryKey: ['members', page, search, eventId, view?.level, view?.code, view?.parentCode],
        queryFn: () => {
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('per_page', perPage);

            if (search) params.set('search', search);
            if (eventId && eventId !== 'all') params.set('event_id', eventId);

            if (view?.level === 'district' && view?.code) {
                params.set('district_id', view.code);
            } else if (view?.level === 'village' && view?.code) {
                const villageId = view.code.includes('.') ? view.code : `${view.parentCode}.${view.code}`;
                params.set('village_id', villageId);
            }

            return apiFetch(`members?${params.toString()}`);
        },
        keepPreviousData: true,
    });
}

export function useSaveMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData) => {
            const isEditing = !!formData.id;
            const endpoint = isEditing ? `members/${formData.id}` : 'members';
            return apiFetch(endpoint, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['member-summary'] });
        },
    });
}

export function useDeleteMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            return apiFetch(`members/${id}`, { method: 'DELETE' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['member-summary'] });
        },
    });
}
