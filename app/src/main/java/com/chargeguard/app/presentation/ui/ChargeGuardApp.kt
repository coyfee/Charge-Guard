package com.chargeguard.app.presentation.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chargeguard.app.data.local.entity.SubscriptionEntity
import com.chargeguard.app.presentation.ChargeGuardViewModel
import com.chargeguard.app.presentation.DashboardUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChargeGuardApp(viewModel: ChargeGuardViewModel) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = "ChargeGuard Shield",
                            tint = Color(0xFF16A34A),
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "ChargeGuard",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp
                        )
                    }
                },
                actions = {
                    Surface(
                        color = Color(0xFFDCFCE7),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(Color(0xFF16A34A), shape = RoundedCornerShape(4.dp))
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "100% Offline",
                                color = Color(0xFF15803D),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = uiState.selectedTab == 0,
                    onClick = { viewModel.selectTab(0) },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                    label = { Text("Overview") }
                )
                NavigationBarItem(
                    selected = uiState.selectedTab == 1,
                    onClick = { viewModel.selectTab(1) },
                    icon = { Icon(Icons.Default.CreditCard, contentDescription = "Subscriptions") },
                    label = { Text("Subs (${uiState.monitoredSubscriptionsCount})") }
                )
                NavigationBarItem(
                    selected = uiState.selectedTab == 2,
                    onClick = { viewModel.selectTab(2) },
                    icon = { Icon(Icons.Default.NotificationsActive, contentDescription = "Alerts") },
                    label = { Text("Alerts") }
                )
                NavigationBarItem(
                    selected = uiState.selectedTab == 3,
                    onClick = { viewModel.selectTab(3) },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") }
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (uiState.selectedTab) {
                0 -> DashboardScreen(uiState)
                1 -> SubscriptionsScreen(uiState, onDelete = { viewModel.deleteSubscription(it) })
                2 -> AlertsScreen(uiState)
                else -> SettingsScreen(uiState)
            }
        }
    }
}

@Composable
fun DashboardScreen(state: DashboardUiState) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Active Protection Engine",
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF166534),
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Monitoring ${state.monitoredSubscriptionsCount} recurring services with ${state.scheduledRemindersCount} scheduled hardware alarms.",
                        color = Color(0xFF15803D),
                        fontSize = 14.sp
                    )
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    title = "Monthly Spend",
                    value = "PHP ${String.format("%.2f", state.monthlySpend)}",
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Annual Forecast",
                    value = "PHP ${String.format("%.2f", state.annualEstimatedSpend)}",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Text(
                text = "Upcoming Renewals",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                modifier = Modifier.padding(vertical = 4.dp)
            )
        }

        if (state.subscriptions.isEmpty()) {
            item {
                Text(
                    text = "No subscriptions added yet. Incoming notification & SMS signals will appear here automatically.",
                    color = Color.Gray,
                    fontSize = 14.sp
                )
            }
        } else {
            items(state.subscriptions) { sub ->
                SubscriptionRow(sub)
            }
        }
    }
}

@Composable
fun MetricCard(title: String, value: String, modifier: Modifier = Modifier) {
    Card(
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = title, color = Color.Gray, fontSize = 12.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = value, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

@Composable
fun SubscriptionRow(sub: SubscriptionEntity) {
    Card(
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = sub.displayName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(
                    text = "Renews: ${sub.nextRenewalDate} (${sub.billingFrequency.name.lowercase()})",
                    color = Color.Gray,
                    fontSize = 13.sp
                )
            }
            Text(
                text = "${sub.currency} ${String.format("%.2f", sub.amount)}",
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF1E293B),
                fontSize = 16.sp
            )
        }
    }
}

@Composable
fun SubscriptionsScreen(state: DashboardUiState, onDelete: (String) -> Unit) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "All Tracked Subscriptions (${state.subscriptions.size})",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        }
        items(state.subscriptions) { sub ->
            SubscriptionRow(sub)
        }
    }
}

@Composable
fun AlertsScreen(state: DashboardUiState) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Exact Scheduled Alarms (${state.reminders.size})",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        }
        items(state.reminders) { reminder ->
            Card(shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = reminder.title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(text = reminder.body, fontSize = 13.sp, color = Color.DarkGray)
                }
            }
        }
    }
}

@Composable
fun SettingsScreen(state: DashboardUiState) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(text = "Security & Privacy", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        Card(shape = RoundedCornerShape(12.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Zero Internet Isolation", fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "ChargeGuard does not declare the INTERNET permission in AndroidManifest.xml. All subscription parsing and alarm calculation happens 100% on your device.",
                    fontSize = 13.sp,
                    color = Color.Gray
                )
            }
        }
    }
}
