import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


export const Profile = () => {


    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    async function handleLogout(){
        alert("hi")
        await supabase.auth.signOut();
        // window.location.reload();
        navigate("/");
    }
    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data, error: userError } = await supabase
                    .auth.getUser();
                if (userError) throw userError;
                setUser(data.user);
            } catch (err: any) {
                setError(err.message || "Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);
  return (
    <div>
        {loading ? (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin" />
            </div>
        ): error ? (
            <div>Error: {error}</div>
        ) : (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center border-2 border-gray-500 rounded-lg p-4 w-full max-w-md ">
                    {user?.user_metadata.avatar_url ?<img src={user?.user_metadata?.avatar_url} alt="avatar" className="rounded-full w-32 h-32 mb-4 text-yellow" />:<div className="flex items-center justify-center bg-gray-300 text-white rounded-full w-32 h-32 mb-4">
                            <p className="text-3xl bold text-white">{(user?.user_metadata?.full_name)?.charAt(0).toUpperCase()}</p>
                        </div>}<h1 className="text-2xl font-bold mb-4 dark:bg-black bg-white">Profile</h1>
                        <div><p className="mb-2 dark:bg-black bg-white">Name: {user?.user_metadata.full_name}</p></div>
                        <div><p className="mb-2 dark:bg-black bg-white">Phone: {user?.user_metadata.phone}</p></div>
                        <div><p className="mb-2 dark:bg-black bg-white">Email: {user?.email}</p></div>
                        <p className="text-white dark:bg-black bg-white">Address: {user?.user_metadata.address}</p>
                         <HoverBorderGradient
                            containerClassName="rounded-full"
                            as="button"
                            className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2">
                            <span>Edit Profile</span>
                        </HoverBorderGradient>
                        <HoverBorderGradient
                            containerClassName="rounded-full "
                            as="button"
                            className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
                            onClick={handleLogout}
                            >
                            <span>Logout</span>
                        </HoverBorderGradient>
                </div>
                
            </div>
        )}
    
    </div>
  );
};