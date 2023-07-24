<script lang="ts">
    import { enhance } from "$app/forms";
    import { supabaseClient } from "$lib/supabase";

    let number: Number;
    let multiplier: number = 1;
    let spentClicks: Number = 0;
    let message: String|null;

    async function getCurrent() {
        const { data, error } = await supabaseClient
        .from('instant-data')
        .select("clicks, multiplier, spent_clicks, message")

        if (data?.at(0)?.clicks != null) {
            number = data?.at(0)?.clicks;
        }

        if (data?.at(0)?.multiplier != null) {
            multiplier = data.at(0)?.multiplier;
        }

        if (data?.at(0)?.multiplier != null) {
            spentClicks = data.at(0)?.spent_clicks;
        }

        message = data?.at(0)?.message;
    }

    let promise = getCurrent();
    
    supabaseClient
        .channel('any')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'instant-data' }, payload => {
                number = payload.new.clicks
                multiplier = payload.new.multiplier
                spentClicks = payload.new.spent_clicks
                message = payload.new.message
            })
        .subscribe()

</script>

<div class="hero min-h-screen">
    <div class="hero-content text-center">
        <div class="max-w-md">
            <h1 class="text-5xl font-bold">Increase</h1>

            {#await promise}
                <p class="py-6">Fetching number...</p>
            {:then}
                <form method="POST" use:enhance>
                    <div class="flex">
                        <p class="flex flex-1 py-6 text-lime-500">{number}</p>
                        <p class="flex flex-1 justify-end py-6 text-emerald-500">{spentClicks}</p>
                    </div>

                    <div class="flex">
                        <button class="btn btn-primary flex flex-1" formaction="?/updateClicks">Click Me</button>
                        <button class="flex flex-1 btn btn-error" formaction="?/spendClicks">Spend 100 clicks</button>
                    </div>
                </form>
                {#if multiplier < 1}
                    <p class="text-sm py-2 text-sky-500">Multiplier: x{multiplier}</p>
                {:else if multiplier == 1}
                    <p class="text-sm py-2">Multiplier: x{multiplier}</p>
                {:else if multiplier >= 2 && multiplier < 6}
                    <p class="text-sm py-2 text-amber-300">Multiplier: x{multiplier}</p>
                {:else if multiplier >= 6}
                    <p class="text-sm py-2 text-red-700">Multiplier: x{multiplier}</p>
                {/if}
                
                {#if message != null}
                    <p class="py-2 font-bold font-mono text-xl text-fuchsia-300">{message}</p>
                {/if}
            {/await}
        </div>
    </div>
</div>
