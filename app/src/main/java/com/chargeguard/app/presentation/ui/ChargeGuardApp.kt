package com.chargeguard.app.presentation.ui

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.chargeguard.app.data.local.entity.BillingFrequency
import com.chargeguard.app.data.local.entity.DetectionSource
import com.chargeguard.app.data.local.entity.ReminderEntity
import com.chargeguard.app.data.local.entity.SubscriptionEntity
import com.chargeguard.app.data.local.entity.SubscriptionStatus
import com.chargeguard.app.presentation.ChargeGuardViewModel
import com.chargeguard.app.presentation.DashboardUiState
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChargeGuardApp(viewModel: ChargeGuardViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    // Check permissions on start
    LaunchedEffect(Unit) {
        viewModel.refreshPermissions(context)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFFDCFCE7),
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Security,
                                    contentDescription = "ChargeGuard Shield",
                                    tint = Color(0xFF16A34A),
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "ChargeGuard",
                                fontWeight = FontWeight.Bold,
                                fontSize = 19.sp,
                                color = Color(0xFF0F172A)
                            )
                            Text(
                                text = "100% Offline Subscription Shield",
                                fontSize = 11.sp,
                                color = Color(0xFF64748B)
                            )
                        }
                    }
                },
                actions = {
                    Surface(
                        color = Color(0xFFF1F5F9),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF16A34A))
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "No Cloud / Local Only",
                                color = Color(0xFF334155),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = uiState.selectedTab == 0,
                    onClick = { viewModel.selectTab(0) },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Overview") },
                    label = { Text("Overview") }
                )
                NavigationBarItem(
                    selected = uiState.selectedTab == 1,
                    onClick = { viewModel.selectTab(1) },
                    icon = {
                        BadgedBox(
                            badge = {
                                if (uiState.monitoredSubscriptionsCount > 0) {
                                    Badge { Text(uiState.monitoredSubscriptionsCount.toString()) }
                                }
                            }
                        ) {
                            Icon(Icons.Default.CreditCard, contentDescription = "Subscriptions")
                        }
                    },
                    label = { Text("Subs") }
                )
                NavigationBarItem(
                    selected = uiState.selectedTab == 2,
                    onClick = { viewModel.selectTab(2) },
                    icon = {
                        BadgedBox(
                            badge = {
                                if (uiState.scheduledRemindersCount > 0) {
                                    Badge { Text(uiState.scheduledRemindersCount.toString()) }
                                }
                            }
                        ) {
                            Icon(Icons.Default.NotificationsActive, contentDescription = "Alerts")
                        }
                    },
                    label = { Text("Alerts") }
                )
                NavigationBarItem(
                    selected = uiState.selectedTab == 3,
                    onClick = { viewModel.selectTab(3) },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") }
                )
            }
        },
        floatingActionButton = {
            if (uiState.selectedTab == 0 || uiState.selectedTab == 1) {
                FloatingActionButton(
                    onClick = { viewModel.openAddSheet() },
                    containerColor = Color(0xFF16A34A),
                    contentColor = Color.White
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Subscription")
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
        ) {
            when (uiState.selectedTab) {
                0 -> OverviewScreen(
                    state = uiState,
                    onAddClick = { viewModel.openAddSheet() },
                    onSimulateSignal = { viewModel.simulateNotificationSignal(it) },
                    onEditSub = { viewModel.openEditSheet(it) }
                )
                1 -> SubscriptionsScreen(
                    state = uiState,
                    onSearchChange = { viewModel.setSearchQuery(it) },
                    onCategorySelect = { viewModel.setSelectedCategory(it) },
                    onEditSub = { viewModel.openEditSheet(it) },
                    onDeleteSub = { viewModel.deleteSubscription(it) },
                    onAddClick = { viewModel.openAddSheet() }
                )
                2 -> AlertsScreen(
                    state = uiState,
                    onDismissReminder = { viewModel.dismissReminder(it) },
                    onTestTrigger = { viewModel.testTriggerReminder(it) }
                )
                else -> SettingsScreen(
                    state = uiState,
                    onRefreshPermissions = { viewModel.refreshPermissions(context) },
                    onSimulateSignal = { viewModel.simulateNotificationSignal(it) },
                    onClearSimResult = { viewModel.clearSimulationResult() }
                )
            }

            // Add/Edit Subscription Modal Dialog
            if (uiState.isAddEditSheetOpen) {
                AddEditSubscriptionDialog(
                    subscription = uiState.editingSubscription,
                    onDismiss = { viewModel.closeAddEditSheet() },
                    onSave = { id, name, amount, currency, frequency, renewalDate, category, isTrial, notes ->
                        viewModel.saveSubscription(
                            id = id,
                            name = name,
                            amount = amount,
                            currency = currency,
                            frequency = frequency,
                            renewalDate = renewalDate,
                            category = category,
                            isTrial = isTrial,
                            notes = notes
                        )
                    }
                )
            }
        }
    }
}

@Composable
fun OverviewScreen(
    state: DashboardUiState,
    onAddClick: () -> Unit,
    onSimulateSignal: (String) -> Unit,
    onEditSub: (SubscriptionEntity) -> Unit
) {
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Protection Header Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Shield,
                                contentDescription = null,
                                tint = Color(0xFF16A34A),
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Active Hardware Protection",
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF166534),
                                fontSize = 15.sp
                            )
                        }
                        Surface(
                            color = Color(0xFFDCFCE7),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "${state.scheduledRemindersCount} Alarms Set",
                                color = Color(0xFF15803D),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = if (state.monitoredSubscriptionsCount > 0) {
                            "Guarding ${state.monitoredSubscriptionsCount} subscriptions against surprise auto-renewals. Exact local alarms fire 7d, 3d, and 24h before billing."
                        } else {
                            "No subscriptions protected yet. Add your first service below or receive an SMS/notification to activate automated offline alarms."
                        },
                        color = Color(0xFF15803D),
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                }
            }
        }

        // 2. Metrics Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricTile(
                        title = "Monthly Outflow",
                        value = "₱ ${String.format("%.2f", state.monthlySpend)}",
                        subtitle = "Recurring run-rate",
                        icon = Icons.Default.TrendingUp,
                        iconColor = Color(0xFF2563EB),
                        modifier = Modifier.weight(1f)
                    )
                    MetricTile(
                        title = "Annual Forecast",
                        value = "₱ ${String.format("%.2f", state.annualEstimatedSpend)}",
                        subtitle = "Projected 12-mo total",
                        icon = Icons.Default.CalendarToday,
                        iconColor = Color(0xFF7C3AED),
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricTile(
                        title = "Next 30 Days",
                        value = "₱ ${String.format("%.2f", state.upcoming30DaysSpend)}",
                        subtitle = "Imminent charges",
                        icon = Icons.Default.AccountBalanceWallet,
                        iconColor = Color(0xFFD97706),
                        modifier = Modifier.weight(1f)
                    )
                    MetricTile(
                        title = "Protected Subs",
                        value = "${state.monitoredSubscriptionsCount}",
                        subtitle = "Zero cloud sync",
                        icon = Icons.Default.Lock,
                        iconColor = Color(0xFF059669),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // 3. Imminent Next Renewal Highlight (if available)
        state.nextUpcomingSubscription?.let { nextSub ->
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.WarningAmber,
                                    contentDescription = null,
                                    tint = Color(0xFFD97706),
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "NEXT IMMINENT RENEWAL",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = Color(0xFFB45309)
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = nextSub.displayName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = Color(0xFF78350F)
                            )
                            Text(
                                text = "Renews on ${nextSub.nextRenewalDate} (${nextSub.billingFrequency.name.lowercase()})",
                                fontSize = 12.sp,
                                color = Color(0xFF92400E)
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "${nextSub.currency} ${String.format("%.2f", nextSub.amount)}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 17.sp,
                                color = Color(0xFF78350F)
                            )
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Color(0xFFFDE68A)
                            ) {
                                Text(
                                    text = formatDaysUntil(nextSub.nextRenewalDate),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF92400E),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // 4. Quick Actions Row
        item {
            Text(
                text = "Quick Actions",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = Color(0xFF0F172A)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = onAddClick,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A)),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Add Sub", fontSize = 13.sp)
                }

                OutlinedButton(
                    onClick = {
                        // Quick test simulation
                        onSimulateSignal("Your Netflix standard plan renewal for PHP 549.00 will be charged on 2026-09-05.")
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color(0xFF16A34A))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Test Signal", fontSize = 13.sp, color = Color(0xFF0F172A))
                }
            }
        }

        // 5. Monitored Subscriptions Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Tracked Subscriptions",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = Color(0xFF0F172A)
                )
                if (state.subscriptions.isNotEmpty()) {
                    Text(
                        text = "${state.subscriptions.size} total",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )
                }
            }
        }

        if (state.subscriptions.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFFF1F5F9),
                            modifier = Modifier.size(48.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.CreditCardOff,
                                    contentDescription = null,
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No Subscriptions Monitored",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = Color(0xFF1E293B)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Add manual subscriptions (Netflix, Spotify, ChatGPT) or turn on Notification Listener in Settings to auto-detect receipts.",
                            fontSize = 12.sp,
                            color = Color(0xFF64748B),
                            modifier = Modifier.padding(horizontal = 8.dp),
                            lineHeight = 16.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = onAddClick,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Add Subscription Now")
                        }
                    }
                }
            }
        } else {
            items(state.subscriptions.take(5)) { sub ->
                SubscriptionCardItem(
                    subscription = sub,
                    onEdit = { onEditSub(sub) },
                    onDelete = {}
                )
            }
        }
    }
}

@Composable
fun MetricTile(
    title: String,
    value: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF64748B)
                )
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = Color(0xFF0F172A)
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subtitle,
                fontSize = 10.sp,
                color = Color(0xFF94A3B8)
            )
        }
    }
}

@Composable
fun SubscriptionsScreen(
    state: DashboardUiState,
    onSearchChange: (String) -> Unit,
    onCategorySelect: (String) -> Unit,
    onEditSub: (SubscriptionEntity) -> Unit,
    onDeleteSub: (String) -> Unit,
    onAddClick: () -> Unit
) {
    var subToDelete by remember { mutableStateOf<SubscriptionEntity?>(null) }

    val categories = listOf("ALL", "Entertainment", "AI & Developer", "Cloud Storage", "Productivity", "Digital Services")

    val filteredSubs = state.subscriptions.filter { sub ->
        val matchesSearch = sub.displayName.contains(state.searchQuery, ignoreCase = true) ||
                sub.merchantName.contains(state.searchQuery, ignoreCase = true) ||
                sub.category.contains(state.searchQuery, ignoreCase = true)
        val matchesCategory = state.selectedCategory == "ALL" || sub.category.equals(state.selectedCategory, ignoreCase = true)
        matchesSearch && matchesCategory
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Title & Stats
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Subscriptions (${state.subscriptions.size})",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = Color(0xFF0F172A)
                    )
                    Text(
                        text = "Real Room database records with exact alarm triggers",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )
                }
                IconButton(onClick = onAddClick) {
                    Icon(Icons.Default.AddCircle, contentDescription = "Add", tint = Color(0xFF16A34A), modifier = Modifier.size(32.dp))
                }
            }
        }

        // Search Field
        item {
            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = onSearchChange,
                placeholder = { Text("Search by name, category...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFF94A3B8)) },
                trailingIcon = {
                    if (state.searchQuery.isNotEmpty()) {
                        IconButton(onClick = { onSearchChange("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear")
                        }
                    }
                },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White
                ),
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Category Filter Chips
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { cat ->
                    val isSelected = state.selectedCategory == cat
                    FilterChip(
                        selected = isSelected,
                        onClick = { onCategorySelect(cat) },
                        label = { Text(cat, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFF0F172A),
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        // List of Subscriptions
        if (filteredSubs.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.SearchOff,
                            contentDescription = null,
                            tint = Color(0xFF94A3B8),
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = if (state.subscriptions.isEmpty()) "No Subscriptions Tracked" else "No matching subscriptions",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = Color(0xFF1E293B)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (state.subscriptions.isEmpty()) "Tap '+' to add your subscriptions and establish exact alarm protections." else "Try adjusting your search query or category filter.",
                            fontSize = 12.sp,
                            color = Color(0xFF64748B)
                        )
                    }
                }
            }
        } else {
            items(filteredSubs, key = { it.id }) { sub ->
                SubscriptionCardItem(
                    subscription = sub,
                    onEdit = { onEditSub(sub) },
                    onDelete = { subToDelete = sub }
                )
            }
        }
    }

    // Delete Confirmation Dialog
    subToDelete?.let { sub ->
        AlertDialog(
            onDismissRequest = { subToDelete = null },
            title = { Text("Delete Subscription") },
            text = { Text("Are you sure you want to remove ${sub.displayName}? All associated exact hardware alarms will also be cancelled.") },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteSub(sub.id)
                        subToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { subToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun SubscriptionCardItem(
    subscription: SubscriptionEntity,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Surface(
                        shape = CircleShape,
                        color = Color(0xFFF1F5F9),
                        modifier = Modifier.size(38.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = subscription.displayName.take(1).uppercase(),
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF334155),
                                fontSize = 16.sp
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = subscription.displayName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = Color(0xFF0F172A)
                            )
                            if (subscription.isTrial) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = Color(0xFFFEF3C7)
                                ) {
                                    Text(
                                        text = "TRIAL",
                                        color = Color(0xFFB45309),
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                    )
                                }
                            }
                        }
                        Text(
                            text = subscription.category,
                            fontSize = 11.sp,
                            color = Color(0xFF64748B)
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "${subscription.currency} ${String.format("%.2f", subscription.amount)}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = Color(0xFF0F172A)
                    )
                    Text(
                        text = "/ ${subscription.billingFrequency.name.lowercase()}",
                        fontSize = 10.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            Divider(color = Color(0xFFF1F5F9))
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Event,
                        contentDescription = null,
                        tint = Color(0xFF64748B),
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Renews ${subscription.nextRenewalDate}",
                        fontSize = 12.sp,
                        color = Color(0xFF475569)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFFEFF6FF)
                    ) {
                        Text(
                            text = formatDaysUntil(subscription.nextRenewalDate),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF2563EB),
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onEdit, modifier = Modifier.size(30.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) {
                        Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun AlertsScreen(
    state: DashboardUiState,
    onDismissReminder: (String) -> Unit,
    onTestTrigger: (ReminderEntity) -> Unit
) {
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Column {
                Text(
                    text = "Scheduled Hardware Alarms (${state.reminders.size})",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = "Exact wake alarms registered with Android AlarmManager",
                    fontSize = 12.sp,
                    color = Color(0xFF64748B)
                )
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = Color(0xFF0284C7),
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Alarms execute even during Android Doze mode without internet connection.",
                        fontSize = 11.sp,
                        color = Color(0xFF0369A1),
                        lineHeight = 15.sp
                    )
                }
            }
        }

        if (state.reminders.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.NotificationsOff,
                            contentDescription = null,
                            tint = Color(0xFF94A3B8),
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No Alarms Scheduled",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = Color(0xFF1E293B)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "When you add subscriptions, ChargeGuard automatically computes and schedules exact hardware alerts for 7d, 3d, and 24h before renewal.",
                            fontSize = 12.sp,
                            color = Color(0xFF64748B),
                            lineHeight = 16.sp
                        )
                    }
                }
            }
        } else {
            items(state.reminders, key = { it.id }) { reminder ->
                ReminderCardItem(
                    reminder = reminder,
                    onDismiss = { onDismissReminder(reminder.id) },
                    onTestTrigger = { onTestTrigger(reminder) }
                )
            }
        }
    }
}

@Composable
fun ReminderCardItem(
    reminder: ReminderEntity,
    onDismiss: () -> Unit,
    onTestTrigger: () -> Unit
) {
    val triggerDateStr = try {
        val instant = Instant.ofEpochMilli(reminder.triggerTimeEpochMillis)
        val ldt = instant.atZone(ZoneId.systemDefault()).toLocalDateTime()
        ldt.format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a"))
    } catch (e: Exception) {
        "Scheduled"
    }

    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Surface(
                        shape = CircleShape,
                        color = Color(0xFFDCFCE7),
                        modifier = Modifier.size(34.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Alarm,
                                contentDescription = null,
                                tint = Color(0xFF16A34A),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = reminder.title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF0F172A)
                        )
                        Text(
                            text = reminder.reminderType.name.replace("_", " "),
                            fontSize = 10.sp,
                            color = Color(0xFF16A34A),
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = Color(0xFFF1F5F9)
                ) {
                    Text(
                        text = "${reminder.currency} ${String.format("%.2f", reminder.amount)}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = Color(0xFF334155),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = reminder.body,
                fontSize = 12.sp,
                color = Color(0xFF475569),
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(10.dp))
            Divider(color = Color(0xFFF1F5F9))
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = Color(0xFF64748B),
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = triggerDateStr,
                        fontSize = 11.sp,
                        color = Color(0xFF64748B)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedButton(
                        onClick = onTestTrigger,
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        modifier = Modifier.height(28.dp),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(2.dp))
                        Text("Test Fire", fontSize = 10.sp)
                    }

                    TextButton(
                        onClick = onDismiss,
                        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Text("Dismiss", fontSize = 10.sp, color = Color(0xFF94A3B8))
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsScreen(
    state: DashboardUiState,
    onRefreshPermissions: () -> Unit,
    onSimulateSignal: (String) -> Unit,
    onClearSimResult: () -> Unit
) {
    val context = LocalContext.current
    var testSmsText by remember { mutableStateOf("Your Netflix standard plan renewal for PHP 549.00 will be charged on 2026-09-05.") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column {
                Text(
                    text = "System Diagnostics & Privacy",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = "Manage on-device hardware permissions and signal parsers",
                    fontSize = 12.sp,
                    color = Color(0xFF64748B)
                )
            }
        }

        // 1. Android Permission Status Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Hardware Permissions",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = Color(0xFF0F172A)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Exact Alarms
                    PermissionRow(
                        title = "Exact Hardware Alarms",
                        description = "Required to trigger notifications at the exact millisecond before charge.",
                        isGranted = state.isExactAlarmGranted,
                        onAction = {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                                    data = Uri.parse("package:${context.packageName}")
                                }
                                context.startActivity(intent)
                            }
                        }
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Divider(color = Color(0xFFF1F5F9))
                    Spacer(modifier = Modifier.height(10.dp))

                    // Notification Listener
                    PermissionRow(
                        title = "Notification Signal Listener",
                        description = "Enables automatic extraction of receipts from bank SMS and Google Play notifications.",
                        isGranted = state.isNotificationListenerGranted,
                        onAction = {
                            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                            context.startActivity(intent)
                        }
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Divider(color = Color(0xFFF1F5F9))
                    Spacer(modifier = Modifier.height(10.dp))

                    // App Notifications
                    PermissionRow(
                        title = "App Notifications",
                        description = "Required to display heads-up reminder banners when alarms fire.",
                        isGranted = state.isPostNotificationsGranted,
                        onAction = {
                            val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                                putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                            }
                            context.startActivity(intent)
                        }
                    )
                }
            }
        }

        // 2. On-Device Signal Parser Simulator
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Bolt, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "On-Device Signal Simulator",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = Color(0xFF0F172A)
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Paste any bank SMS or notification snippet to test the offline regex parsing engine and auto-schedule alarms.",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = testSmsText,
                        onValueChange = { testSmsText = it },
                        label = { Text("Simulated Notification / SMS Body") },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { onSimulateSignal(testSmsText) },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Test Parse & Store", fontSize = 12.sp)
                        }

                        OutlinedButton(
                            onClick = {
                                testSmsText = "OpenAI ChatGPT Plus subscription renewed. Charged $20.00 to card on 2026-09-12."
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Preset: OpenAI", fontSize = 11.sp)
                        }
                    }

                    state.simulatedSignalResult?.let { result ->
                        Spacer(modifier = Modifier.height(10.dp))
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color(0xFFF0FDF4),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = result,
                                    fontSize = 12.sp,
                                    color = Color(0xFF166534),
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.weight(1f)
                                )
                                IconButton(onClick = onClearSimResult, modifier = Modifier.size(24.dp)) {
                                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFF166534), modifier = Modifier.size(14.dp))
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Privacy & Zero-Internet Guarantee
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Zero-Internet Guarantee",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF0F172A)
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "ChargeGuard has NO android.permission.INTERNET declared in its manifest. The OS prevents any network packets from leaving this application. All parsing, entity storage, and alarm dispatches reside exclusively inside your device's encrypted SQLite sandbox.",
                        fontSize = 12.sp,
                        color = Color(0xFF475569),
                        lineHeight = 17.sp
                    )
                }
            }
        }
    }
}

@Composable
fun PermissionRow(
    title: String,
    description: String,
    isGranted: Boolean,
    onAction: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                    color = Color(0xFF0F172A)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = if (isGranted) Color(0xFFDCFCE7) else Color(0xFFFEE2E2)
                ) {
                    Text(
                        text = if (isGranted) "ENABLED" else "ACTION NEEDED",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isGranted) Color(0xFF15803D) else Color(0xFFB91C1C),
                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = description,
                fontSize = 11.sp,
                color = Color(0xFF64748B),
                lineHeight = 15.sp
            )
        }
        Spacer(modifier = Modifier.width(10.dp))
        Button(
            onClick = onAction,
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isGranted) Color(0xFFF1F5F9) else Color(0xFF16A34A),
                contentColor = if (isGranted) Color(0xFF334155) else Color.White
            ),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.height(32.dp)
        ) {
            Text(if (isGranted) "Settings" else "Enable", fontSize = 11.sp)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditSubscriptionDialog(
    subscription: SubscriptionEntity?,
    onDismiss: () -> Unit,
    onSave: (
        id: String?,
        name: String,
        amount: Double,
        currency: String,
        frequency: BillingFrequency,
        renewalDate: String,
        category: String,
        isTrial: Boolean,
        notes: String
    ) -> Unit
) {
    var name by remember { mutableStateOf(subscription?.displayName ?: "") }
    var amountText by remember { mutableStateOf(subscription?.amount?.toString() ?: "") }
    var currency by remember { mutableStateOf(subscription?.currency ?: "PHP") }
    var frequency by remember { mutableStateOf(subscription?.billingFrequency ?: BillingFrequency.MONTHLY) }
    var renewalDate by remember { mutableStateOf(subscription?.nextRenewalDate ?: LocalDate.now().plusMonths(1).format(DateTimeFormatter.ISO_LOCAL_DATE)) }
    var category by remember { mutableStateOf(subscription?.category ?: "Entertainment") }
    var isTrial by remember { mutableStateOf(subscription?.isTrial ?: false) }
    var notes by remember { mutableStateOf(subscription?.notes ?: "") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val quickPresets = listOf(
        "Netflix" to 549.00,
        "Spotify" to 149.00,
        "ChatGPT Plus" to 1100.00,
        "YouTube Premium" to 159.00,
        "Google One" to 89.00,
        "Canva Pro" to 249.00,
        "Apple iCloud+" to 49.00,
        "Disney+" to 369.00
    )

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (subscription == null) "Add Subscription" else "Edit Subscription",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = Color(0xFF0F172A)
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFF64748B))
                    }
                }

                // Quick Preset Chips (when adding new)
                if (subscription == null) {
                    Text(text = "Quick Presets:", fontSize = 11.sp, color = Color(0xFF64748B))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        quickPresets.forEach { (presetName, presetAmt) ->
                            SuggestionChip(
                                onClick = {
                                    name = presetName
                                    amountText = presetAmt.toString()
                                    category = when (presetName) {
                                        "ChatGPT Plus" -> "AI & Developer"
                                        "Google One", "Apple iCloud+" -> "Cloud Storage"
                                        "Canva Pro" -> "Productivity"
                                        else -> "Entertainment"
                                    }
                                },
                                label = { Text(presetName, fontSize = 11.sp) }
                            )
                        }
                    }
                }

                // Service Name Input
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Service Name (e.g. Netflix, Spotify)") },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                // Amount & Currency Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = amountText,
                        onValueChange = { amountText = it },
                        label = { Text("Amount") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1.5f)
                    )

                    OutlinedTextField(
                        value = currency,
                        onValueChange = { currency = it.uppercase() },
                        label = { Text("Currency") },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    )
                }

                // Billing Frequency
                Text(text = "Billing Frequency:", fontSize = 12.sp, color = Color(0xFF475569))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    BillingFrequency.values().forEach { freq ->
                        FilterChip(
                            selected = frequency == freq,
                            onClick = { frequency = freq },
                            label = { Text(freq.name.lowercase().capitalize(), fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFF16A34A),
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }

                // Next Renewal Date
                OutlinedTextField(
                    value = renewalDate,
                    onValueChange = { renewalDate = it },
                    label = { Text("Next Renewal Date (YYYY-MM-DD)") },
                    placeholder = { Text("2026-09-15") },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                // Quick Date Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    SuggestionChip(
                        onClick = { renewalDate = LocalDate.now().plusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE) },
                        label = { Text("Tomorrow", fontSize = 10.sp) }
                    )
                    SuggestionChip(
                        onClick = { renewalDate = LocalDate.now().plusDays(3).format(DateTimeFormatter.ISO_LOCAL_DATE) },
                        label = { Text("In 3 Days", fontSize = 10.sp) }
                    )
                    SuggestionChip(
                        onClick = { renewalDate = LocalDate.now().plusDays(7).format(DateTimeFormatter.ISO_LOCAL_DATE) },
                        label = { Text("In 7 Days", fontSize = 10.sp) }
                    )
                    SuggestionChip(
                        onClick = { renewalDate = LocalDate.now().plusMonths(1).format(DateTimeFormatter.ISO_LOCAL_DATE) },
                        label = { Text("In 1 Month", fontSize = 10.sp) }
                    )
                }

                // Category Selection
                Text(text = "Category:", fontSize = 12.sp, color = Color(0xFF475569))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("Entertainment", "AI & Developer", "Cloud Storage", "Productivity", "Digital Services").forEach { cat ->
                        FilterChip(
                            selected = category == cat,
                            onClick = { category = cat },
                            label = { Text(cat, fontSize = 11.sp) }
                        )
                    }
                }

                // Free Trial Toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Free Trial Period", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Text(text = "Triggers immediate cancellation reminders before trial ends", fontSize = 11.sp, color = Color(0xFF64748B))
                    }
                    Switch(checked = isTrial, onCheckedChange = { isTrial = it })
                }

                // Notes Field
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (optional)") },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                errorMessage?.let { err ->
                    Text(text = err, color = Color(0xFFDC2626), fontSize = 12.sp)
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            val parsedAmount = amountText.toDoubleOrNull()
                            if (name.isBlank()) {
                                errorMessage = "Please enter a service name"
                            } else if (parsedAmount == null || parsedAmount <= 0) {
                                errorMessage = "Please enter a valid amount"
                            } else if (!renewalDate.matches(Regex("^\\d{4}-\\d{2}-\\d{2}$"))) {
                                errorMessage = "Please enter date in YYYY-MM-DD format"
                            } else {
                                errorMessage = null
                                onSave(
                                    subscription?.id,
                                    name.trim(),
                                    parsedAmount,
                                    currency.trim().ifEmpty { "PHP" },
                                    frequency,
                                    renewalDate.trim(),
                                    category,
                                    isTrial,
                                    notes.trim()
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Save & Protect")
                    }
                }
            }
        }
    }
}

fun formatDaysUntil(dateIso: String): String {
    return try {
        val target = LocalDate.parse(dateIso)
        val today = LocalDate.now()
        val days = ChronoUnit.DAYS.between(today, target)
        when {
            days < 0 -> "${-days}d overdue"
            days == 0L -> "Renews today"
            days == 1L -> "Tomorrow"
            else -> "In ${days}d"
        }
    } catch (e: Exception) {
        "Upcoming"
    }
}

fun String.capitalize(): String {
    return this.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
}
