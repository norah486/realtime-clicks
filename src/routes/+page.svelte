<script lang="ts">
    import { enhance } from "$app/forms";
    import { supabaseClient } from "$lib/supabase";

    let number: Number;
    let multiplier: number = 1;

    async function getCurrent() {
        const { data, error } = await supabaseClient
        .from('instant-data')
        .select("clicks")

        if (data?.at(0)?.clicks != null) {
            number = data?.at(0)?.clicks;
        }
    }

    async function getMultiplier() {
        const { data, error } = await supabaseClient
        .from('instant-data')
        .select("multiplier")

        if (data?.at(0)?.multiplier != null) {
            multiplier = data.at(0)?.multiplier;
        }
    }

    let promise = getCurrent();
    getMultiplier();
    
    supabaseClient
        .channel('any')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'instant-data' }, payload => {
                number = payload.new.clicks
                multiplier = payload.new.multiplier
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
                <form method="POST" action="?/updateClicks" use:enhance>
                    <p class="py-6">{number}</p>
                    <button class="btn btn-primary">Click Me</button>
                </form>
                {#if multiplier == 1}
                    <p class="text-sm py-2">Multiplier: x{multiplier}</p>
                {:else if multiplier >= 2 && multiplier < 6}
                    <p class="text-sm py-2 text-amber-300">Multiplier: x{multiplier}</p>
                {:else if multiplier >= 6}
                    <p class="text-sm py-2 text-red-700">Multiplier: x{multiplier}</p>
                {/if}
                <p class="text-sm py-2 blur-sm">Things will happen</p>
            {/await}
        </div>
    </div>
</div>
