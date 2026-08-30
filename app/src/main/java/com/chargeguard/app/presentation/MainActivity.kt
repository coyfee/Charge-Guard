package com.chargeguard.app.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.chargeguard.app.ChargeGuardApplication
import com.chargeguard.app.presentation.ui.ChargeGuardApp

class MainActivity : ComponentActivity() {

    private val viewModel: ChargeGuardViewModel by viewModels {
        ChargeGuardViewModel.Factory(ChargeGuardApplication.instance.repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ChargeGuardApp(viewModel = viewModel)
                }
            }
        }
    }
}
