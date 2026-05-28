import re

with open('src/app/login/page.tsx', 'r') as f:
    content = f.read()

new_handle = '''  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Force page reload to ensure auth state is properly initialized
      if (data.user && (data.user.role === "admin" || data.user.role === "super_admin")) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };'''

pattern = r'const handleSubmit\s*=\s*async\s*\(e:\s*React\.FormEvent\).*?(?=return \(|\n  return )'
content = re.sub(pattern, new_handle, content, flags=re.DOTALL)

with open('src/app/login/page.tsx', 'w') as f:
    f.write(content)
print('Done')
