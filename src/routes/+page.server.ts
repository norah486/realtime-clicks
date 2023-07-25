import { supabaseClient } from '$lib/supabase';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    return {};
}) satisfies PageServerLoad;

export const actions = {

    updateClicks: async ({ request }) => {

        let shopItemsGives: number = 0;

        const { data: shopData, error: shopErr} = await supabaseClient
        .from('shop')
        .select()

        if (shopData) {
            shopData.forEach(item => {
                shopItemsGives += ( item.gives * item.amount )
            });
        }

        const { data, error } = await supabaseClient
        .from('instant_data')
        .select("clicks, multiplier, spent_clicks")

        if (data?.at(0)?.clicks != null) {

            let clickPlus = ( 1 * Math.floor( (data?.at(0)?.multiplier * (1 + data?.at(0)?.spent_clicks / 100000)) + shopItemsGives ) )

            const { error } = await supabaseClient
            .rpc("incrementClicks", {
                extra: clickPlus
            })

        }
    },

    spendClicks: async ({ request }) => {
        const { data, error } = await supabaseClient
        .from('instant_data')
        .select("clicks, multiplier, spent_clicks")

        if (data?.at(0)?.clicks >= 100) {

            const { error } = await supabaseClient
            .rpc("decreaseClicks", {
                amount: 100
            })

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
        .from('instant_data')
        .select()

        if (clickData?.at(0)?.clicks >= shopData?.at(0)?.cost) {

            const { error: clicksErr } = await supabaseClient
            .from('instant_data')
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
        .from('instant_data')
        .select()

        if (clickData?.at(0)?.spent_clicks >= shopData?.at(0)?.cost) {

            const { error: clicksErr } = await supabaseClient
            .from('instant_data')
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

    gamble: async ({ request }) => {
        const { data, error } = await supabaseClient
        .from('instant_data')
        .select()

        const rNumber = Math.floor(Math.random() * 3500) + 1;

        let newMult: Number;
        const gachaMult = Math.random()
        if (gachaMult < 0.85) {
            newMult = Number((Math.random() * 1 + 1).toFixed(1));
        } else {
            newMult = Number((Math.random() * 3 + 3).toFixed(1));
        }

        const uses = Math.random() < 0.5 ? "clicks" : "spent_clicks";

        if (uses === "clicks") {
            if (data?.at(0)?.clicks >= rNumber) {

                const { error: clErr } = await supabaseClient
                .from('instant_data')
                .update({
                    clicks: data?.at(0)?.clicks - rNumber,
                    multiplier: newMult
                })
                .eq('id', 1)
            }
        } else {
            if (data?.at(0)?.spent_clicks >= rNumber) {

                const { error: clErr } = await supabaseClient
                .from('instant_data')
                .update({
                    spent_clicks: data?.at(0)?.spent_clicks - rNumber,
                    multiplier: newMult
                })
                .eq('id', 1)
            }
        }
    },

    test: async ({ request }) => {
        const { data, error } = await supabaseClient
        .rpc("test")

        console.log(error)
    },

    ascend: async ({ request }) => {
        const { data, error } = await supabaseClient
        .rpc("dec10")
    }

}
