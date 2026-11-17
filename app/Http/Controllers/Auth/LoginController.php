<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'name' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('name', $credentials['name'])->first();

        // Same message for an unknown user and a wrong password so the form
        // can't be used to discover valid user names.
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return back()->withErrors([
                'name' => 'Invalid user name or password.',
            ])->onlyInput('name');
        }

        // Only revealed once the password is proven correct.
        // The user may log in through the entire expiry day.
        if ($user->expired_at && now()->isAfter($user->expired_at->copy()->endOfDay())) {
            return back()->withErrors([
                'name' => 'Your User Account has expired. Please contact the support team',
            ])->onlyInput('name');
        }

        // Clear an expired remember token (if exists)
        if ($user->remember_token && $user->remember_token_expires_at
            && now()->isAfter($user->remember_token_expires_at)) {
            $user->update([
                'remember_token' => null,
                'remember_token_expires_at' => null,
            ]);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        // If remember me is checked, set token expiration to 7 days
        if ($request->boolean('remember')) {
            $user->update([
                'remember_token_expires_at' => now()->addDays(7),
            ]);
        }

        return redirect()->intended(route('dashboard'));
    }
}
