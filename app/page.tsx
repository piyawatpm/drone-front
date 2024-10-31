import { useEffect } from "react";
import { useRouter } from "next/navigation";
const Home = () => {
  const router = useRouter();
  useEffect(() => {
    router.push("/login");
  }, []);
  return <div>Home</div>;
};

export default Home;
