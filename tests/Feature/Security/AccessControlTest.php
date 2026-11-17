<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    /** Management endpoints that only admins may call. */
    private const ADMIN_ONLY = [
        ['get', '/settings'],
        ['get', '/clients'],
        ['get', '/suppliers'],
        ['post', '/api/settings/update-vat'],
        ['post', '/api/settings/update-fuel-price'],
        ['post', '/api/settings/update-company'],
        ['post', '/api/lubricants/store'],
        ['put', '/api/lubricants/update/1'],
        ['delete', '/api/lubricants/delete/1'],
        ['post', '/api/lubricants/update-price'],
        ['post', '/api/suppliers/store'],
        ['put', '/api/suppliers/update/1'],
        ['delete', '/api/suppliers/delete/1'],
        ['post', '/api/clients/store-client'],
        ['post', '/api/clients/store-vehicle'],
        ['put', '/api/clients/update-client/1'],
        ['put', '/api/clients/update-vehicle/1'],
        ['delete', '/api/clients/delete-client/1'],
        ['delete', '/api/clients/delete-vehicle/1'],
        ['get', '/admin/users'],
    ];

    public function test_normal_users_cannot_use_admin_only_endpoints(): void
    {
        $user = User::factory()->create(['user_type' => 'user']);

        foreach (self::ADMIN_ONLY as [$method, $uri]) {
            $this->actingAs($user)->{$method}($uri)->assertForbidden();
        }
    }

    public function test_guests_are_not_allowed_on_admin_only_or_api_endpoints(): void
    {
        foreach (self::ADMIN_ONLY as [$method, $uri]) {
            $this->{$method}($uri)->assertRedirect(route('login'));
        }

        $this->getJson('/api/invoice/list')->assertUnauthorized();
    }

    public function test_admins_pass_the_admin_gate(): void
    {
        $admin = User::factory()->create(['user_type' => 'admin']);

        $this->actingAs($admin)->get('/settings')->assertSuccessful();
    }

    public function test_normal_users_keep_day_to_day_access(): void
    {
        $user = User::factory()->create(['user_type' => 'user']);

        $this->actingAs($user)->get('/dashboard')->assertSuccessful();
    }
}
