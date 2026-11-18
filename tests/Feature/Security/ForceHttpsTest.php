<?php

namespace Tests\Feature\Security;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForceHttpsTest extends TestCase
{
    use RefreshDatabase;

    public function test_http_requests_are_redirected_to_https_when_enabled(): void
    {
        config(['app.force_https' => true]);

        $this->get('http://example.test/login?x=1')
            ->assertStatus(308)
            ->assertRedirect('https://example.test/login?x=1');

        $this->post('http://example.test/logout')
            ->assertStatus(308)
            ->assertRedirect('https://example.test/logout');
    }

    public function test_https_requests_pass_and_get_hsts_and_upgrade_insecure_requests(): void
    {
        config(['app.force_https' => true]);

        $response = $this->get('https://example.test/login');

        $response->assertSuccessful();
        $response->assertHeader('Strict-Transport-Security');

        if (file_exists(public_path('hot'))) {
            $this->markTestSkipped('Vite dev server is running (public/hot): CSP is not sent.');
        }

        $this->assertStringContainsString(
            'upgrade-insecure-requests',
            $response->headers->get('Content-Security-Policy'),
        );
    }

    public function test_health_endpoint_is_not_redirected(): void
    {
        config(['app.force_https' => true]);

        $this->get('http://example.test/up')->assertSuccessful();
    }

    public function test_nothing_is_forced_when_disabled(): void
    {
        config(['app.force_https' => false]);

        $this->get('http://example.test/login')->assertSuccessful();
    }
}
