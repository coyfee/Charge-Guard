package com.chargeguard.app.presentation

import android.app.AlarmManager
import android.content.Context
import android.os.Build
import android.os.PowerManager
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.chargeguard.app.data.local.entity.BillingFrequency
import com.chargeguard.app.data.local.entity.DetectionSource
import com.chargeguard.app.data.local.entity.ReminderEntity
import com.chargeguard.app.data.local.entity.SubscriptionEntity
import com.chargeguard.app.data.local.entity.SubscriptionStatus
import com.chargeguard.app.data.repository.SubscriptionRepository
import com.chargeguard.app.domain.parser.LocalSignalParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

data class DashboardUiState(
    val isProtectionActive: Boolean = true,
    val isOfflineMode: Boolean = true,
    val monitoredSubscriptionsCount: Int = 0,
    val scheduledRemindersCount: Int = 0,
    val nextUpcomingSubscription: SubscriptionEntity? = null,
    val monthlySpend: Double = 0.0,
    val annualEstimatedSpend: Double = 0.0,
    val upcoming30DaysSpend: Double = 0.0,
    val subscriptions: List<SubscriptionEntity> = emptyList(),
    val reminders: List<ReminderEntity> = emptyList(),
    val selectedTab: Int = 0, // 0: Overview, 1: Subs, 2: Alerts, 3: Settings
    val searchQuery: String = "",
    val selectedCategory: String = "ALL",
    val isAddEditSheetOpen: Boolean = false,
    val editingSubscription: SubscriptionEntity? = null,
    val isNotificationListenerGranted: Boolean = false,
    val isExactAlarmGranted: Boolean = true,
    val isPostNotificationsGranted: Boolean = true,
    val isBatteryOptimizationIgnored: Boolean = false,
    val showOnboarding: Boolean = false,
    val simulatedSignalResult: String? = null
)

class ChargeGuardViewModel(
    private val repository: SubscriptionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            combine(
                repository.getAllSubscriptionsFlow(),
                repository.getAllRemindersFlow()
            ) { subs, reminders ->
                val activeSubs = subs.filter { it.status != SubscriptionStatus.CANCELLED }
                
                val monthly = activeSubs.sumOf { sub ->
                    when (sub.billingFrequency) {
                        BillingFrequency.WEEKLY -> sub.amount * 4.33
                        BillingFrequency.MONTHLY -> sub.amount
                        BillingFrequency.QUARTERLY -> sub.amount / 3.0
                        BillingFrequency.SEMI_ANNUALLY -> sub.amount / 6.0
                        BillingFrequency.YEARLY -> sub.amount / 12.0
                    }
                }
                val annual = monthly * 12.0
                
                val todayStr = try {
                    LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
                } catch (e: Exception) {
                    "2026-08-30"
                }

                // Next 30 days upcoming charges
                val upcoming30DaysSubs = activeSubs.filter { sub ->
                    try {
                        val renewal = LocalDate.parse(sub.nextRenewalDate)
                        val today = LocalDate.now()
                        val diff = java.time.temporal.ChronoUnit.DAYS.between(today, renewal)
                        diff in 0..30
                    } catch (e: Exception) {
                        true
                    }
                }
                val upcoming30Spend = upcoming30DaysSubs.sumOf { it.amount }

                val nextSub = activeSubs.minByOrNull { it.nextRenewalDate }

                _uiState.value.copy(
                    isProtectionActive = true,
                    isOfflineMode = true,
                    monitoredSubscriptionsCount = activeSubs.size,
                    scheduledRemindersCount = reminders.count { !it.dismissed },
                    nextUpcomingSubscription = nextSub,
                    monthlySpend = monthly,
                    annualEstimatedSpend = annual,
                    upcoming30DaysSpend = upcoming30Spend,
                    subscriptions = subs,
                    reminders = reminders.sortedBy { it.triggerTimeEpochMillis }
                )
            }.collect { state ->
                _uiState.value = state
            }
        }
    }

    fun selectTab(tabIndex: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = tabIndex)
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    fun setSelectedCategory(category: String) {
        _uiState.value = _uiState.value.copy(selectedCategory = category)
    }

    fun openAddSheet() {
        _uiState.value = _uiState.value.copy(
            isAddEditSheetOpen = true,
            editingSubscription = null
        )
    }

    fun openEditSheet(subscription: SubscriptionEntity) {
        _uiState.value = _uiState.value.copy(
            isAddEditSheetOpen = true,
            editingSubscription = subscription
        )
    }

    fun closeAddEditSheet() {
        _uiState.value = _uiState.value.copy(
            isAddEditSheetOpen = false,
            editingSubscription = null
        )
    }

    fun saveSubscription(
        id: String?,
        name: String,
        amount: Double,
        currency: String,
        frequency: BillingFrequency,
        renewalDate: String,
        category: String,
        isTrial: Boolean,
        notes: String
    ) {
        viewModelScope.launch {
            if (id != null) {
                // Edit existing
                val existing = repository.getSubscriptionById(id)
                val updated = (existing ?: SubscriptionEntity(
                    id = id,
                    merchantName = name,
                    displayName = name,
                    category = category,
                    amount = amount,
                    currency = currency,
                    billingFrequency = frequency,
                    nextRenewalDate = renewalDate
                )).copy(
                    displayName = name,
                    amount = amount,
                    currency = currency,
                    billingFrequency = frequency,
                    nextRenewalDate = renewalDate,
                    category = category,
                    isTrial = isTrial,
                    notes = notes
                )
                repository.updateAndReschedule(updated)
            } else {
                // New subscription
                val newSub = SubscriptionEntity(
                    id = UUID.randomUUID().toString(),
                    merchantName = name,
                    displayName = name,
                    category = category,
                    amount = amount,
                    currency = currency,
                    billingFrequency = frequency,
                    nextRenewalDate = renewalDate,
                    status = if (isTrial) SubscriptionStatus.TRIAL else SubscriptionStatus.CONFIRMED,
                    source = DetectionSource.MANUAL,
                    confidence = 100,
                    isTrial = isTrial,
                    notes = notes
                )
                repository.insertAndSchedule(newSub)
            }
            closeAddEditSheet()
        }
    }

    fun deleteSubscription(id: String) {
        viewModelScope.launch {
            repository.deleteSubscription(id)
        }
    }

    fun dismissReminder(reminderId: String) {
        viewModelScope.launch {
            repository.dismissReminder(reminderId)
        }
    }

    fun testTriggerReminder(reminder: ReminderEntity) {
        viewModelScope.launch {
            repository.testTriggerReminder(reminder)
        }
    }

    fun simulateNotificationSignal(rawText: String) {
        val parsed = LocalSignalParser.parse(rawText)
        if (!parsed.isIgnored && parsed.confidenceScore >= 50 && parsed.amount > 0) {
            val newSub = SubscriptionEntity(
                id = UUID.randomUUID().toString(),
                merchantName = parsed.merchantName,
                displayName = parsed.normalizedName,
                category = "Digital Services",
                amount = parsed.amount,
                currency = parsed.currency,
                billingFrequency = BillingFrequency.MONTHLY,
                nextRenewalDate = parsed.renewalDateIso.ifEmpty { "2026-09-15" },
                status = if (parsed.eventType == "TRIAL_END") SubscriptionStatus.TRIAL else SubscriptionStatus.CONFIRMED,
                source = DetectionSource.NOTIFICATION,
                confidence = parsed.confidenceScore,
                isTrial = parsed.eventType == "TRIAL_END",
                notes = "Auto-detected locally from simulation: ${rawText.take(60)}"
            )
            viewModelScope.launch {
                repository.insertAndSchedule(newSub)
                _uiState.value = _uiState.value.copy(
                    simulatedSignalResult = "Detected: ${parsed.normalizedName} (${parsed.currency} ${parsed.amount}, Score: ${parsed.confidenceScore}%)"
                )
            }
        } else {
            _uiState.value = _uiState.value.copy(
                simulatedSignalResult = if (parsed.isIgnored) "Ignored: ${parsed.reasons.firstOrNull()}" else "Low confidence signal (${parsed.confidenceScore}%)"
            )
        }
    }

    fun clearSimulationResult() {
        _uiState.value = _uiState.value.copy(simulatedSignalResult = null)
    }

    fun refreshPermissions(context: Context) {
        val hasNotificationListener = try {
            NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
        } catch (e: Exception) {
            false
        }

        val hasExactAlarm = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            alarmManager?.canScheduleExactAlarms() ?: true
        } else {
            true
        }

        val hasPostNotifications = NotificationManagerCompat.from(context).areNotificationsEnabled()

        val isBatteryIgnored = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            powerManager?.isIgnoringBatteryOptimizations(context.packageName) ?: false
        } else {
            true
        }

        _uiState.value = _uiState.value.copy(
            isNotificationListenerGranted = hasNotificationListener,
            isExactAlarmGranted = hasExactAlarm,
            isPostNotificationsGranted = hasPostNotifications,
            isBatteryOptimizationIgnored = isBatteryIgnored
        )
    }

    fun dismissOnboarding() {
        _uiState.value = _uiState.value.copy(showOnboarding = false)
    }

    class Factory(private val repository: SubscriptionRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ChargeGuardViewModel(repository) as T
        }
    }
}

