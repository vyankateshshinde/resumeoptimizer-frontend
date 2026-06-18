import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Brain,
  Mail,
  Lock,
  Sparkles,
  FileSearch,
  WandSparkles,
  BarChart3,
  Eye,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post("/api/auth/login", form);
      login(response.data.token);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden flex items-center justify-center px-6">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.25),transparent_35%)]"></div>

      {/* Bottom Wave Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-violet-900/30 to-transparent"></div>
      <div className="absolute bottom-10 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>

      {/* Floating Dots */}
      <div className="absolute top-28 left-24 w-2 h-2 bg-violet-500 rounded-full"></div>
      <div className="absolute bottom-36 left-80 w-2 h-2 bg-indigo-500 rounded-full"></div>
      <div className="absolute top-40 right-40 w-2 h-2 bg-purple-400 rounded-full"></div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        {/* Left Section */}
        <div>
          <div className="flex items-center gap-3 mb-20">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Brain size={26} />
            </div>
            <div>
              <h1 className="font-bold leading-none">AI Resume</h1>
              <p className="text-sm text-violet-300 font-semibold">
                Optimizer
              </p>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight max-w-xl">
            Optimize Your Resume.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Get Your Dream Job.
            </span>
          </h2>

          <p className="mt-6 text-slate-300 text-base leading-7 max-w-lg">
            AI-powered resume analysis, ATS scoring, skill gap detection and
            personalized recommendations to help you stand out.
          </p>

          <div className="mt-10 space-y-5">
            <Feature icon={<FileSearch size={17} />} text="ATS Score Analysis" />
            <Feature icon={<WandSparkles size={17} />} text="AI Recommendations" />
            <Feature icon={<BarChart3 size={17} />} text="Skill Gap Analysis" />
            <Feature icon={<Sparkles size={17} />} text="Smart Learning Roadmaps" />
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-slate-900/75 backdrop-blur-2xl border border-violet-500/20 rounded-3xl p-8 shadow-2xl shadow-violet-950/50">
            <div className="mb-8">
              <h3 className="text-2xl font-bold">Welcome Back!</h3>
              <p className="text-slate-400 text-sm mt-2">
                Sign in to continue to your account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Email
                </label>
                <div className="h-12 flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-4 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 transition">
                  <Mail size={18} className="text-slate-500 mr-3" />
                  <input
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Password
                </label>
                <div className="h-12 flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-4 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 transition">
                  <Lock size={18} className="text-slate-500 mr-3" />
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
                    required
                  />
                  <Eye size={17} className="text-slate-500" />
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    className="text-sm text-violet-400 hover:text-violet-300"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] transition-all duration-300">
                Sign In
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-7">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-violet-400 font-semibold hover:text-violet-300"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, text }) => {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <div className="w-7 h-7 rounded-full bg-violet-500/15 text-violet-400 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

export default LoginPage;