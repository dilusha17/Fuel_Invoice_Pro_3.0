<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_unknown_user_and_wrong_password_get_the_same_error(): void
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), ['name' => 'no-such-user', 'password' => 'x'])
            ->assertSessionHasErrors(['name' => 'Invalid user name or password.']);

        $this->post(route('login.store'), ['name' => $user->name, 'password' => 'wrong'])
            ->assertSessionHasErrors(['name' => 'Invalid user name or password.']);

        $this->assertGuest();
    }

    public function test_expired_account_message_is_not_shown_without_the_correct_password(): void
    {
        $user = User::factory()->create(['expired_at' => now()->subDays(2)]);

        $this->post(route('login.store'), ['name' => $user->name, 'password' => 'wrong'])
            ->assertSessionHasErrors(['name' => 'Invalid user name or password.']);

        $this->post(route('login.store'), ['name' => $user->name, 'password' => 'password'])
            ->assertSessionHasErrors('name');
        $this->assertStringContainsString('expired', session('errors')->first('name'));
        $this->assertGuest();
    }

    public function test_login_is_throttled_after_five_attempts(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->post(route('login.store'), ['name' => $user->name, 'password' => 'wrong'])
                ->assertStatus(302);
        }

        $this->post(route('login.store'), ['name' => $user->name, 'password' => 'password'])
            ->assertStatus(429);
        $this->assertGuest();
    }
}
