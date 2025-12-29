import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GS() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      {/* Screen: GS */}
      
      
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Navigation</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="text-left">HOME</div>
          <Button className="w-full" variant="primary">Home</Button>
          <Button className="w-full" variant="default">Logout</Button>
        </div>
      </section>

      
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Welcome & Data</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <h1 className="text-3xl font-bold text-left">Hello Everyone,</h1>
          <div className="text-center">my name is ganesh.</div>
          <div className="text-left">Data Table</div>
        </div>
      </section>

      
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">User Input Form</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="text-left">Enter your name</div>
          <div className="space-y-2"><Label>Your Name</Label><Input placeholder="Your Name" /></div>
          <div className="space-y-2"><Label>Age</Label><Input placeholder="Age" /></div>
          <Button className="w-full" variant="default">Submit</Button>
        </div>
      </section>
    </div>
  );
}