<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    /** The Admin section: the only area restricted to admins. */
    private const ADMIN_ONLY = [
        ['get', '/admin/users'],
        ['get', '/admin/users/create'],
        ['post', '/admin/users'],
        ['get', '/admin/api/users'],
    ];

    /** Pages every signed-in account (admin or user) can open. */
    private const ANY_SIGNED_IN_USER = [
        '/dashboard',
        '/manage',
        '/tax-invoice',
        '/history',
        '/invoice-summary',
        '/monthly-sale',
        '/purchase',
        '/purchase-summary',
        '/vat-balance',
        '/suppliers',
        '/clients',
        '/settings',
    ];

    public function test_normal_users_cannot_use_the_admin_section(): void
    {
        $user = User::factory()->create(['user_type' => 'user']);

        foreach (self::ADMIN_ONLY as [$method, $uri]) {
            $this->actingAs($user)->{$method}($uri)->assertForbidden();
        }
    }

    public function test_guests_are_not_allowed_on_admin_or_api_endpoints(): void
    {
        foreach (self::ADMIN_ONLY as [$method, $uri]) {
            $this->{$method}($uri)->assertRedirect(route('login'));
        }

        $this->getJson('/api/invoice/list')->assertUnauthorized();
    }

    public function test_admins_pass_the_admin_gate(): void
    {
        $admin = User::factory()->create(['user_type' => 'admin']);

        $this->actingAs($admin)->get('/admin/users')->assertSuccessful();
    }

    public function test_normal_users_can_open_every_page_except_admin(): void
    {
        $user = User::factory()->create(['user_type' => 'user']);

        foreach (self::ANY_SIGNED_IN_USER as $uri) {
            $this->actingAs($user)->get($uri)->assertSuccessful();
        }
    }
}
