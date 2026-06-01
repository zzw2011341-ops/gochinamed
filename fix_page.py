#!/usr/bin/env python3
import re

with open('src/app/page.tsx', 'r') as f:
    lines = f.readlines()

# Find the problem area: </section> followed by featuredDoctors line without proper wrapper
for i, line in enumerate(lines):
    if "featuredDoctors'" in line and i > 0:
        prev = lines[i-1].strip()
        if prev == '</section>':
            print(f"Found issue at line {i+1}")
            replacement = """      {/* Featured Doctors */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t('home.featuredDoctors')}
            </h2>
"""
            lines[i] = replacement
            break

with open('src/app/page.tsx', 'w') as f:
    f.writelines(lines)
print('✅ Fixed')
