import { supabaseClient } from '$lib/supabase';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    return {};
}) satisfies PageServerLoad;

export const actions = {

    updateClicks: async ({ request }) => {

        const { data, error } = await supabaseClient
        .from('instant-data')
        .select("clicks")

        if (data?.at(0)?.clicks != null) {

            const { error } = await supabaseClient
            .from('instant-data')
            .update({ clicks: data?.at(0)?.clicks + 1 })
            .eq('id', 1)
            
        }
    }

}
