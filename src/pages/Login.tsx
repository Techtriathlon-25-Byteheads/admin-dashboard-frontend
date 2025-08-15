import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await api.adminLogin(data.email, data.password);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      if (response.data && 'token' in response.data) {
        // Create user object from email (since API only returns token)
        const user = {
          email: data.email,
          firstName: data.email.includes('superadmin') ? 'Super' : 'Admin',
          lastName: 'User',
          role: (data.email.includes('superadmin') ? 'SUPER_ADMIN' : 'ADMIN') as 'SUPER_ADMIN' | 'ADMIN',
          isActive: true,
        };
        
        login(user, response.data.token);
        toast.success('Login successful');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary-600 mb-2">Government Portal</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            id="email"
            {...register('email')}
            error={errors.email?.message || undefined}
            placeholder="superadmin@gov.lk"
          />

          <div className="relative">
            <Input
              label="Password"
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={errors.password?.message || undefined}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-primary-500 hover:text-primary-600">
            Forgot your password?
          </a>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">Demo Account:</p>
          <p><strong>Super Admin:</strong> superadmin@gov.lk / password123</p>
        </div>
      </div>
    </div>
  );
};