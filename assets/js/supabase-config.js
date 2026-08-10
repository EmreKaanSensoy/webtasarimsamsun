/**
 * samsunwebtasarim.com - Supabase Integration Client Helper (supabase-config.js)
 * Production-ready direct Supabase connection. No localStorage fallback for security and clean data source.
 */

const SupabaseService = (() => {

    const SUPABASE_URL = "https://pkvxxswogozwmduxdgtc.supabase.co"; 
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdnh4c3dvZ296d21kdXhkZ3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTQ2NzksImV4cCI6MjA5OTU5MDY3OX0.h1gDqX6H9dGVUUTfhRostIwovqntWX3n5n_Ztb40IhE";

    if (!window.supabase) {
        console.error("Supabase: Client SDK library is not loaded.");
    }
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    return {
        // Status checks
        isActive: () => true,

        /* ==========================================================================
           SETTINGS LAYER (SERVICES & PRICING CONFIGURATIONS)
           ========================================================================== */
        getSettings: async (key, fallbackDefault) => {
            try {
                const { data, error } = await client
                    .from('settings')
                    .select('value')
                    .eq('key', key)
                    .single();

                if (!error && data) {
                    return data.value;
                }
            } catch (err) {
                console.error(`Supabase: Settings fetch error for ${key}:`, err);
            }
            // Return fallback default values if row doesn't exist in DB yet
            return fallbackDefault;
        },

        saveSettings: async (key, value) => {
            try {
                const { error } = await client
                    .from('settings')
                    .upsert({ key: key, value: value, updated_at: new Date().toISOString() });

                if (error) {
                    console.error(`Supabase: Save settings error for ${key}:`, error);
                    return false;
                }
                return true;
            } catch (err) {
                console.error(`Supabase: Settings save error for ${key}:`, err);
                return false;
            }
        },

        /* ==========================================================================
           LEADS LAYER (PROPOSALS & MESSAGES INBOX)
           ========================================================================== */
        getLeads: async () => {
            try {
                const { data, error } = await client
                    .from('leads')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    return data.map(item => ({
                        id: item.id,
                        clientName: item.client_name,
                        phone: item.phone,
                        email: item.email,
                        type: item.type,
                        scale: item.scale,
                        extras: item.extras,
                        notes: item.notes,
                        price: item.price,
                        duration: item.duration,
                        date: item.created_at,
                        status: item.status
                    }));
                }
                console.error('Supabase: Fetch leads error:', error);
            } catch (err) {
                console.error('Supabase: Leads fetch error:', err);
            }
            return [];
        },

        insertLead: async (lead) => {
            try {
                const { error } = await client
                    .from('leads')
                    .insert([{
                        id: lead.id,
                        client_name: lead.clientName,
                        phone: lead.phone,
                        email: lead.email,
                        type: lead.type,
                        scale: lead.scale,
                        extras: lead.extras,
                        notes: lead.notes,
                        price: lead.price,
                        duration: lead.duration,
                        status: lead.status,
                        created_at: lead.date
                    }]);

                if (error) {
                    console.error('Supabase: Insert lead error:', error);
                    return false;
                }
                return true;
            } catch (err) {
                console.error('Supabase: Lead insert error:', err);
                return false;
            }
        },

        updateLeadStatus: async (id, status) => {
            try {
                const { error } = await client
                    .from('leads')
                    .update({ status: status })
                    .eq('id', id);

                if (error) {
                    console.error('Supabase: Update status error:', error);
                    return false;
                }
                return true;
            } catch (err) {
                console.error('Supabase: Status update error:', err);
                return false;
            }
        },

        deleteLead: async (id) => {
            try {
                const { error } = await client
                    .from('leads')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Supabase: Delete lead error:', error);
                    return false;
                }
                return true;
            } catch (err) {
                console.error('Supabase: Lead delete error:', err);
                return false;
            }
        },

        signOut: async () => {
            try {
                const { error } = await client.auth.signOut();
                if (error) throw error;
                return true;
            } catch (err) {
                console.error("Supabase: Signout error:", err);
                return false;
            }
        }
    };

})();
