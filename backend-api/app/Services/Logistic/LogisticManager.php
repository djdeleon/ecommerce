<?php

namespace App\Services\Logistic;

use Illuminate\Support\Manager;
use Override;

class LogisticManager extends Manager
{
    #[Override]
    public function getDefaultDriver()
    {
        return $this->config->get();
    }
}