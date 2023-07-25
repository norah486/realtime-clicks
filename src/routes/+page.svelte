<script lang="ts">
    import { enhance } from "$app/forms";
    import { supabaseClient } from "$lib/supabase";

    let number: number;
    let multiplier: number = 1;
    let spentClicks: number = 0;
    let message: String|null = null;
    $: spendNumber = 100 + (Math.floor(Math.E * multiplier + (((number + spentClicks))/250) * multiplier))
    
    let unlocked: boolean = false;
    let unlockedClicks: number;
    let ascended: boolean = false;

    interface ShopItems {
        id: number,
        code_name: string,
        item_name: string,
        cost: number,
        amount: number,
        uses: string
        gives: string
    }

    let shopItems: Array<Partial<ShopItems>>|null;

    async function getCurrent() {
        const { data, error } = await supabaseClient
        .from('instant_data')
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

        if (data?.at(0)?.unlocked_clicks != null) {
            unlockedClicks = data.at(0)?.unlocked_clicks
        }

        if (data?.at(0)?.ascended != null) {
            ascended = data.at(0)?.ascended
        }

        message = data?.at(0)?.message;
    }

    async function getShop() {
        const { data, error } = await supabaseClient
        .from('shop')
        .select()
        .order('id', { ascending: true })

        shopItems = data

        if (data?.at(0)?.code_name == 'unlock_end' && data?.at(0)?.amount > 0) {
            unlocked = true
        }
    }

    let promise = getCurrent();
    let shopPromise = getShop();
    
    supabaseClient
        .channel('any')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'instant_data' }, payload => {
                number = payload.new.clicks
                multiplier = payload.new.multiplier
                spentClicks = payload.new.spent_clicks
                message = payload.new.message
                unlockedClicks = payload.new.unlocked_clicks
                ascended = payload.new.ascended
            })
        .subscribe()

    supabaseClient
        .channel('any1')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shop' }, payload => {
                
                if (shopItems != null) {

                    // thanks copilot, lmao
                    const newArray = shopItems.slice(); // create a copy of the old array
                    const newItem = payload.new; // replace with the actual new item
                    const index = newArray.findIndex(item => item.id === newItem.id); // find the index of the object with the specified id
                    if (index !== -1) {
                        shopItems[index] = newItem; // replace the object at the found index with the new one
                    }

                }

                if (payload.new.code_name == 'unlock_end' && payload.new.amount > 0) {
                    unlocked = true
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
    
                {#if ascended}
                    <h2 class="text-4xl font-bold">Thanks for playing</h2>
                    <p class="text-lime-500 py-2">Clicks: {number}</p>
                    <p class="text-emerald-500">Spent Clicks: {spentClicks}</p>
                    <p class="text-lime-500 py-2">$: {unlockedClicks}</p>

                    {#if multiplier < 1}
                        <p class="text-sm py-2 text-sky-500">Multiplier: x{multiplier}</p>
                    {:else if multiplier == 1}
                        <p class="text-sm py-2">Multiplier: x{multiplier}</p>
                    {:else if multiplier > 1 && multiplier < 6}
                        <p class="text-sm py-2 text-amber-300">Multiplier: x{multiplier}</p>
                    {:else if multiplier >= 6}
                        <p class="text-sm py-2 text-red-700">Multiplier: x{multiplier}</p>
                    {/if}

                    {#await shopPromise}
                            <h1 class="font-bold">Fetching shop...</h1>
                    {:then}
                        {#if shopItems != null}
                            <div class="overflow-x-auto w-max">
                                <table class="table table-zebra">
                                <!-- head -->
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Cost</th>
                                            <th>Amount</th>
                                            <th>Uses</th>
                                            <th>Extra clicks given</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each shopItems as s}
                                        <tr>
                                            <th>{s.item_name}</th>
                                            <td>{s.cost}</td>
                                            <td>{s.amount}</td>
                                            <td>{s.uses}</td>
                                            <td>{s.gives}</td>
                                        </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}

                        {#if message != null}
                            <p class="py-2 font-bold font-mono text-xl text-fuchsia-300">{message}</p>
                        {/if}
                    {/await}

                {:else}

                    {#if unlocked}
                        <p class="text-lime-500 py-2">$: {unlockedClicks}</p>

                        <form method="POST" use:enhance>

                            <button class="btn btn-primary" formaction="?/finalClicks">Click</button>

                            {#if unlockedClicks >= (1000000 + Math.ceil((number * (multiplier/2)) + spentClicks))}
                                <button class="btn btn-warning" formaction="?/ascend">Let the world see ({(1000000 + Math.ceil((number * (multiplier/2)) + spentClicks))})</button>
                            {:else}
                                <button class="btn btn-warning btn-disabled">Let the world see ({(1000000 + Math.ceil((number * (multiplier/2)) + spentClicks))})</button>
                            {/if}

                            {#if message != null}
                                <p class="py-2 font-bold font-mono text-xl text-fuchsia-300">{message}</p>
                            {/if}

                        </form>

                    {:else}

                    <p class="text-lime-500 py-2">Clicks: {number}</p>
                    <p class="text-emerald-500">Spent Clicks: {spentClicks}</p>


                    <form method="POST" use:enhance>
                        <div class="flex py-2">
                            <button class="btn btn-primary flex flex-1" formaction="?/updateClicks">Click</button>

                            {#if number < spendNumber}
                                <button class="flex flex-1 btn btn-error btn-disabled">Spend {spendNumber} clicks</button>
                            {:else}
                                <button class="flex flex-1 btn btn-error" formaction="?/spendClicks">Spend {spendNumber} clicks</button>
                            {/if}
                        </div>
                    </form>

                    <form method="POST" use:enhance>
                        <div class="flex flex-1 justify-items-center justify-center py-3 gap-3">
                            <button class="btn btn-secondary" formaction="?/gamble">Gamble</button>
                            <button class="btn btn-warning btn-disabled justify-center self-center align-middle justify-items-center">Let the world see</button>
                        </div>
                    </form>

                    {#if multiplier < 1}
                        <p class="text-sm py-2 text-sky-500">Multiplier: x{multiplier}</p>
                    {:else if multiplier == 1}
                        <p class="text-sm py-2">Multiplier: x{multiplier}</p>
                    {:else if multiplier > 1 && multiplier < 6}
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
                    {/if}
                {/if}
                

            {/await}
        </div>
    </div>
</div>
