'use client';

/**
 * About Page - Minimalist Design
 */

import Link from 'next/link';
import { Users, ShieldCheck, Truck, HeartHandshake, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const stats = [
  { label: 'Active Vendors', value: '500+' },
  { label: 'Products Listed', value: '10,000+' },
  { label: 'Happy Customers', value: '50,000+' },
  { label: 'Countries Served', value: '25+' },
];

const values = [
  {
    icon: ShieldCheck,
    title: 'Trust & Quality',
    description: 'Every vendor is verified and every product is quality-checked to ensure you get the best.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'We empower small businesses and independent sellers to reach customers worldwide.',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Efficient logistics network ensures your orders reach you quickly and safely.',
  },
  {
    icon: HeartHandshake,
    title: 'Customer Support',
    description: 'Our dedicated team is here 24/7 to help with any questions or concerns.',
  },
];

const team = [
  { name: 'Alex Gardner', role: 'Founder & CEO', initials: 'AG' },
  { name: 'Sarah Chen', role: 'Head of Operations', initials: 'SC' },
  { name: 'Marcus Johnson', role: 'Lead Developer', initials: 'MJ' },
  { name: 'Emily Roberts', role: 'Customer Success', initials: 'ER' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-neutral-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent)]" />
        
        <div className="relative container-custom py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Building the future of
              <span className="block text-neutral-400">e-commerce</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-300 leading-relaxed">
              AG-EcOM is a multi-vendor marketplace connecting quality sellers with customers worldwide. 
              We believe in empowering businesses of all sizes to thrive in the digital economy.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/products">
                <Button className="h-12 px-6 bg-white text-neutral-900 hover:bg-neutral-100">
                  Start Shopping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/vendor/setup">
                <Button variant="outline" className="h-12 px-6 border-neutral-700 text-white hover:bg-neutral-800">
                  Become a Vendor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-neutral-100">
        <div className="container-custom py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl md:text-4xl font-bold text-neutral-900">{stat.value}</div>
                <div className="mt-1 text-sm text-neutral-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="container-custom py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-neutral-900">Our Story</h2>
          <div className="mt-8 space-y-6 text-neutral-600 leading-relaxed">
            <p>
              Founded in 2024, AG-EcOM started with a simple idea: create a marketplace where 
              independent sellers can compete fairly alongside established brands, and where 
              customers can discover unique products from around the world.
            </p>
            <p>
              What began as a small platform with just a handful of vendors has grown into a 
              thriving community of entrepreneurs and shoppers. Today, we're proud to support 
              thousands of businesses in reaching their customers and achieving their dreams.
            </p>
            <p>
              Our commitment to quality, transparency, and customer satisfaction drives everything 
              we do. We're not just building a marketplace – we're building a community.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-neutral-50">
        <div className="container-custom py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">What We Stand For</h2>
            <p className="mt-3 text-neutral-500">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card 
                key={value.title} 
                className="p-6 border-neutral-100 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <value.icon className="h-6 w-6 text-neutral-700" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">{value.title}</h3>
                <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container-custom py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900">Meet Our Team</h2>
          <p className="mt-3 text-neutral-500">The people behind AG-EcOM</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {team.map((member, index) => (
            <div 
              key={member.name} 
              className="text-center group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4 group-hover:bg-neutral-900 group-hover:scale-110 transition-all duration-300">
                <span className="text-xl font-semibold text-neutral-600 group-hover:text-white transition-colors">{member.initials}</span>
              </div>
              <h3 className="font-medium text-neutral-900">{member.name}</h3>
              <p className="text-sm text-neutral-500">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-neutral-900 text-white">
        <div className="container-custom py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold">Ready to get started?</h2>
              <p className="mt-2 text-neutral-400">
                Join thousands of vendors and customers on AG-EcOM today.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/register">
                <Button className="h-11 px-6 bg-white text-neutral-900 hover:bg-neutral-100">
                  Create Account
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="h-11 px-6 border-neutral-700 text-white hover:bg-neutral-800">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
