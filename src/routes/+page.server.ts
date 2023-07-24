import { supabaseClient } from '$lib/supabase';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    return {};
}) satisfies PageServerLoad;

export const actions = {

    updateClicks: async ({ request }) => {

        const { data, error } = await supabaseClient
        .from('instant-data')
        .select("clicks, multiplier, spent_clicks")

        if (data?.at(0)?.clicks != null) {

            const { error } = await supabaseClient
            .from('instant-data')
            .update({ clicks: data?.at(0)?.clicks + ( 1 * Math.floor(data?.at(0)?.multiplier * (data?.at(0)?.spent_clicks / 100000)) ) })
            .eq('id', 1)

        }
    },

    spendClicks: async ({ request }) => {
        const { data, error } = await supabaseClient
        .from('instant-data')
        .select("clicks, multiplier, spent_clicks")

        if (data?.at(0)?.clicks >= 100) {

            const { error } = await supabaseClient
            .from('instant-data')
            .update({ clicks: data?.at(0)?.clicks - 100, spent_clicks: data?.at(0)?.spent_clicks + 100 })
            .eq('id', 1)

        }
    }

}
