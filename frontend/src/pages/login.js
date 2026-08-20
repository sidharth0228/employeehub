import api, { setToken, setUser } from '../api.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';

export default async function loginPage() {
  document.getElementById('app').innerHTML = `
    <!--- Full Stitch Login Design --->
    <div class="min-h-screen flex antialiased">
      <div class="hidden lg:flex w-1/2 bg-on-primary-fixed flex-col justify-between p-2xl relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-on-primary-fixed via-on-primary-fixed-variant to-primary opacity-90 z-0"></div>
        <div class="relative z-10">
          <div class="flex items-center gap-sm mb-lg">
            <span class="material-symbols-outlined text-title-lg text-primary-fixed-dim" style="font-variation-settings: 'FILL' 1;">domain</span>
            <span class="font-title-lg text-title-lg text-on-primary">EmployeeHub</span>
          </div>
          <p class="font-headline-md text-headline-md text-primary-fixed-dim max-w-md mt-2xl">
            Powering Smarter People Operations.
          </p>
          <div class="mt-xl space-y-4">
            <div class="flex items-center gap-3 text-primary-fixed-dim">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">verified_user</span>
              <span class="font-body-lg text-body-lg">Secure & compliant HR management</span>
            </div>
            <div class="flex items-center gap-3 text-primary-fixed-dim">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">group</span>
              <span class="font-body-lg text-body-lg">Complete employee lifecycle tracking</span>
            </div>
            <div class="flex items-center gap-3 text-primary-fixed-dim">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">insert_chart</span>
              <span class="font-body-lg text-body-lg">Real-time workforce analytics</span>
            </div>
          </div>
        </div>
        <div class="relative z-10 flex flex-col gap-4 mt-auto">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="bg-white/10 rounded-xl p-4">
              <p class="text-2xl font-bold text-on-primary">15+</p>
              <p class="text-sm text-primary-fixed-dim">Employees</p>
            </div>
            <div class="bg-white/10 rounded-xl p-4">
              <p class="text-2xl font-bold text-on-primary">8</p>
              <p class="text-sm text-primary-fixed-dim">Departments</p>
            </div>
            <div class="bg-white/10 rounded-xl p-4">
              <p class="text-2xl font-bold text-on-primary">100%</p>
              <p class="text-sm text-primary-fixed-dim">Secure</p>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-lg lg:p-2xl bg-surface">
        <div class="w-full max-w-[420px] bg-surface-container-lowest rounded-xl p-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-outline-variant">
          <div class="flex items-center gap-sm mb-xl lg:hidden justify-center">
            <span class="material-symbols-outlined text-title-lg text-primary" style="font-variation-settings: 'FILL' 1;">domain</span>
            <span class="font-title-lg text-title-lg text-primary">EmployeeHub</span>
          </div>
          <div class="text-center mb-xl">
            <h1 class="font-headline-md text-headline-md text-on-surface mb-sm">Welcome Back</h1>
            <p class="font-body-md text-body-md text-on-surface-variant">Sign in to access your HR workspace</p>
          </div>

          <div id="login-error" class="hidden mb-md p-3 bg-error-container text-on-error-container rounded-lg font-body-md text-body-md text-sm"></div>

          <form id="login-form" class="space-y-lg">
            <div class="space-y-sm">
              <label class="block font-label-md text-label-md text-on-surface" for="email">Work Email</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
                  <span class="material-symbols-outlined text-on-surface-variant text-[20px]">mail</span>
                </div>
                <input class="block w-full pl-10 pr-md py-sm bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" id="email" name="email" placeholder="admin@employeehub.com" required type="email" value="admin@employeehub.com"/>
              </div>
            </div>
            <div class="space-y-sm">
              <label class="block font-label-md text-label-md text-on-surface" for="password">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
                  <span class="material-symbols-outlined text-on-surface-variant text-[20px]">lock</span>
                </div>
                <input class="block w-full pl-10 pr-10 py-sm bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" id="password" name="password" placeholder="••••••••" required type="password" value="password123"/>
                <button class="absolute inset-y-0 right-0 pr-md flex items-center text-on-surface-variant hover:text-on-surface transition-colors" id="toggle-password" type="button">
                  <span class="material-symbols-outlined text-[20px]" id="pw-icon">visibility_off</span>
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between pt-sm">
              <div class="flex items-center">
                <input class="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" id="remember-me" type="checkbox"/>
                <label class="ml-sm block font-body-md text-body-md text-on-surface-variant cursor-pointer" for="remember-me">Remember me</label>
              </div>
              <a class="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors" href="#">Forgot Password?</a>
            </div>
            <div class="pt-sm">
              <button class="w-full flex justify-center items-center gap-2 py-sm px-md border border-transparent rounded-DEFAULT shadow-sm font-title-md text-title-md text-on-primary bg-primary hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors cursor-pointer" id="login-btn" type="submit">
                <span id="login-spinner" class="hidden material-symbols-outlined animate-spin text-[18px]">autorenew</span>
                Sign In
              </button>
            </div>
          </form>
          <p class="mt-md text-center font-label-md text-label-md text-secondary">
            Default: admin@employeehub.com / password123
          </p>
        </div>
      </div>
    </div>
  `;

  // Password toggle
  document.getElementById('toggle-password').addEventListener('click', () => {
    const pw = document.getElementById('password');
    const icon = document.getElementById('pw-icon');
    if (pw.type === 'password') { pw.type = 'text'; icon.textContent = 'visibility'; }
    else { pw.type = 'password'; icon.textContent = 'visibility_off'; }
  });

  // Form submit
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');
    const spinner = document.getElementById('login-spinner');
    const errorEl = document.getElementById('login-error');

    btn.disabled = true;
    spinner.classList.remove('hidden');
    errorEl.classList.add('hidden');

    try {
      const data = await api.auth.login(email, password);
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      spinner.classList.add('hidden');
    }
  });
}
