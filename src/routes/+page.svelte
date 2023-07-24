<script lang="ts">
    import { enhance } from "$app/forms";
    import { supabaseClient } from "$lib/supabase";

    let number: number;
    let multiplier: number = 1;
    let spentClicks: number = 0;
    let message: String|null = null;

    interface ShopItems {
        id: number,
        code_name: string,
        item_name: string,
        cost: number,
        amount: number,
        image: string
        uses: string
    }

    let shopItems: Array<Partial<ShopItems>>|null;

    async function getCurrent() {
        const { data, error } = await supabaseClient
        .from('instant-data')
        .select()

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

    async function getShop() {
        const { data, error } = await supabaseClient
        .from('shop')
        .select()
        .order('id', { ascending: true })

        shopItems = data
    }

    let promise = getCurrent();
    let shopPromise = getShop();
    
    supabaseClient
        .channel('any')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'instant-data' }, payload => {
                number = payload.new.clicks
                multiplier = payload.new.multiplier
                spentClicks = payload.new.spent_clicks
                message = payload.new.message
            })
        .subscribe()

    supabaseClient
        .channel('any1')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shop' }, payload => {
                
                if (shopItems != null) {

                    const newArray = shopItems.slice(); // create a copy of the old array
                    const newItem = payload.new; // replace with the actual new item
                    const index = newArray.findIndex(item => item.id === newItem.id); // find the index of the object with the specified id
                    if (index !== -1) {
                        shopItems[index] = newItem; // replace the object at the found index with the new one
                    }

                }

            })
        .subscribe()
    
    supabaseClient
        .channel('any2')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shop' }, payload => {
                
                shopPromise = getShop();

            })
        .subscribe()

    supabaseClient
        .channel('any3')
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'shop' }, payload => {
                
                shopPromise = getShop();

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
    
                <p class="text-lime-500 py-2">Clicks: {number}</p>
                <p class="text-emerald-500">Spent Clicks: {spentClicks}</p>


                <form method="POST" use:enhance>
                    <div class="flex py-2">
                        <button class="btn btn-primary flex flex-1" formaction="?/updateClicks">Click</button>

                        {#if number < 100}
                            <button class="flex flex-1 btn btn-error btn-disabled">Spend 100 clicks</button>
                        {:else}
                            <button class="flex flex-1 btn btn-error" formaction="?/spendClicks">Spend 100 clicks</button>
                        {/if}
                    </div>
                </form>

                <div class="flex flex-1 justify-items-center justify-center py-3">
                    <button class="btn btn-warning btn-disabled justify-center self-center align-middle justify-items-center" formaction="?/ascend">Let the world see</button>
                </div>

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

                
                <div class="hero-content max-w-full w-full flex-wrap flex flex-1">
                    {#await shopPromise}
                        <h1 class="font-bold">Fetching shop...</h1>
                    {:then}
                        {#if shopItems != null}
                            {#each shopItems as s}

                                <form method="POST" use:enhance>

                                    <div class="card card-compact bg-base-200 shadow-xl w-96">
                                        <div class="card-body">
                                            <h2 class="card-title">{s.item_name}</h2>
                                            <p>Cost: {s.cost}</p>
                                            <p>Current amount: {s.amount}</p>
                                            <div class="card-actions justify-end">
                                                {#if s.uses == "clicks"}
                                                    {#if number < (s.cost || 0)}
                                                        <button class="btn btn-primary btn-disabled">Buy with Clicks</button>
                                                    {:else}
                                                        <button class="btn btn-primary" formaction="?/buy_w_clicks">Buy with Clicks</button>
                                                    {/if}
                                                {:else if s.uses == "spent"}
                                                    {#if spentClicks < (s.cost || 0)}
                                                        <button class="btn btn-primary btn-disabled">Buy with Spent Clicks</button>
                                                    {:else}
                                                        <button class="btn btn-primary" formaction="?/buy_w_spent">Buy with Spent Clicks</button>
                                                    {/if}
                                                {/if}
                                            </div>
                                        </div>
                                    </div>

                                    <input type="hidden" name="codename" value="{s.code_name}">

                                </form>
                                
                            {/each}
                        {/if}
                    {/await}
                </div>
                

            {/await}
        </div>
    </div>
</div>
