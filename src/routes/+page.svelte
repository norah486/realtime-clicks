<script lang="ts">
    import { enhance } from "$app/forms";
    import { supabaseClient } from "$lib/supabase";

    let number: Number;

    async function getCurrent() {
        const { data, error } = await supabaseClient
        .from('instant-data')
        .select("clicks")

        if (data?.at(0)?.clicks != null) {
            number = data?.at(0)?.clicks;
        }
    }

    let promise = getCurrent();
    
    supabaseClient
        .channel('any')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'instant-data' }, payload => {
                number = payload.new.clicks
            })
        .subscribe()

</script>

<div class="hero min-h-screen bg-base-200">
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
                <p class="text-sm py-2">Things may happen</p>
            {/await}
        </div>
    </div>
</div>
