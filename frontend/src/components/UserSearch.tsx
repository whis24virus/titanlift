import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { followUser, unfollowUser } from '../api/client';

// Mock search API for now, simulating finding users
// In real backend, we'd add a /api/users/search endpoint
const searchUsers = async (query: string) => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Valid mock users
    const mockUsers = [
        { id: "763b9c95-4bae-4044-9d30-7ae513286b37", username: "Demo User", is_following: false },
        { id: "e1e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5", username: "Alice Fit", is_following: false },
        { id: "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2", username: "Bob Lifter", is_following: true },
    ];

    return mockUsers.filter(u => u.username.toLowerCase().includes(query.toLowerCase()));
};

export function UserSearch() {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const queryClient = useQueryClient();

    // Simple debounce effect
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        // In real app, use useDebounce hook
        setTimeout(() => setDebouncedQuery(e.target.value), 500);
    };

    const { data: results, isLoading } = useQuery({
        queryKey: ['userSearch', debouncedQuery],
        queryFn: () => searchUsers(debouncedQuery),
        enabled: debouncedQuery.length > 0
    });

    const followMutation = useMutation({
        mutationFn: followUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userSearch'] });
            queryClient.invalidateQueries({ queryKey: ['socialProfile'] });
        }
    });

    const unfollowMutation = useMutation({
        mutationFn: unfollowUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userSearch'] });
            queryClient.invalidateQueries({ queryKey: ['socialProfile'] });
        }
    });

    return (
        <div className="w-full max-w-md mx-auto relative group">
            <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Find friends..."
                    value={query}
                    onChange={handleSearch}
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-500/50 outline-none backdrop-blur-sm"
                />
            </div>

            {debouncedQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-xl z-[60] animate-in fade-in slide-in-from-top-2">
                    {isLoading ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
                    ) : results?.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">No users found</div>
                    ) : (
                        <div className="space-y-1">
                            {results?.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                                    <span className="font-bold">{user.username}</span>
                                    <button
                                        onClick={() => {
                                            if (user.is_following) {
                                                unfollowMutation.mutate(user.id);
                                            } else {
                                                followMutation.mutate(user.id);
                                            }
                                        }}
                                        className={`p-2 rounded-full transition-all ${user.is_following
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                            }`}
                                    >
                                        {user.is_following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
