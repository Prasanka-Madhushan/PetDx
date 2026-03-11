import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { signupSchema } from '../../utils/validation';

export default function SignupScreen() {
    const { user } = useAuth();
    const { signUp, logout } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  });


  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  const onSubmit = async (data) => {
  try {
    setLoading(true);
    await signUp(data.email, data.password);
    await logout();

    Alert.alert(
      'Success',
      'Account created successfully! Please login.',
      [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
    );
  } catch (error) {
    Alert.alert('Signup Failed', error.message || 'Could not create account');
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#6B4EFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="paw" size={80} color="#6B4EFF" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join PetDx to start identifying pets</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <CustomInput
                label="Email"
                icon="mail-outline"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <CustomInput
                label="Password"
                icon="lock-closed-outline"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                showPasswordToggle
                onTogglePassword={() => setShowPassword(!showPassword)}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <CustomInput
                label="Confirm Password"
                icon="lock-closed-outline"
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                value={value}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                showPasswordToggle
                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            )}
          />

          <CustomButton
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            variant="primary"
            size="large"
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#888',
    fontSize: 15,
  },
  loginLink: {
    color: '#6B4EFF',
    fontSize: 15,
    fontWeight: '600',
  },
});