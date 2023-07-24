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
    },

    buy_w_clicks: async ({ request }) => {
        const fdata = await request.formData();

        let name = fdata.get("codename");

        const { data: shopData, error: shopErr } = await supabaseClient
        .from('shop')
        .select()
        .eq('code_name', name)
        
        const { data: clickData, error: clickErr } = await supabaseClient
        .from('instant-data')
        .select()

        if (clickData?.at(0)?.clicks >= shopData?.at(0)?.cost) {

            const { error: clicksErr } = await supabaseClient
            .from('instant-data')
            .update({
                clicks: clickData?.at(0)?.clicks - shopData?.at(0)?.cost
            })
            .eq('id', 1)

            const { error: updErr } = await supabaseClient
            .from('shop')
            .update({
                amount: shopData?.at(0)?.amount + 1,
                cost: shopData?.at(0)?.cost + Math.ceil((1000 * ( shopData?.at(0)?.amount + 1 ) * 0.75 ))
            })
            .eq('code_name', name)

        }

        
    },

    buy_w_spent: async ({ request }) => {
        const fdata = await request.formData();

        let name = fdata.get("codename");

        const { data: shopData, error: shopErr } = await supabaseClient
        .from('shop')
        .select()
        .eq('code_name', name)
        
        const { data: clickData, error: clickErr } = await supabaseClient
        .from('instant-data')
        .select()

        if (clickData?.at(0)?.spent_clicks >= shopData?.at(0)?.cost) {

            const { error: clicksErr } = await supabaseClient
            .from('instant-data')
            .update({
                spent_clicks: clickData?.at(0)?.spent_clicks - shopData?.at(0)?.cost
            })
            .eq('id', 1)

            const { error: updErr } = await supabaseClient
            .from('shop')
            .update({
                amount: shopData?.at(0)?.amount + 1,
                cost: shopData?.at(0)?.cost + Math.ceil((1000 * ( shopData?.at(0)?.amount + 1 ) * 0.75 ))
            })
            .eq('code_name', name)

        }

        
    },

    ascend: async ({ request }) => {
        console.log("You shouldn't be here right now.")
    }

}
