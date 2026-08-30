package com.chargeguard.app.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.chargeguard.app.data.local.entity.ReminderEntity
import com.chargeguard.app.data.local.entity.SubscriptionEntity
import com.chargeguard.app.data.repository.SubscriptionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

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
    val selectedTab: Int = 0 // 0: Dashboard, 1: Subscriptions, 2: Alerts, 3: Engine, 4: Settings
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
                val activeSubs = subs.filter { it.status.name != "CANCELLED" }
                val monthly = activeSubs.sumOf { 
                    if (it.billingFrequency.name == "YEARLY") it.amount / 12 else it.amount 
                }
                val annual = monthly * 12
                val upcoming30 = activeSubs.take(4).sumOf { it.amount }

                _uiState.value.copy(
                    isProtectionActive = true,
                    isOfflineMode = true,
                    monitoredSubscriptionsCount = activeSubs.size,
                    scheduledRemindersCount = reminders.count { !it.dismissed },
                    nextUpcomingSubscription = activeSubs.minByOrNull { it.nextRenewalDate },
                    monthlySpend = monthly,
                    annualEstimatedSpend = annual,
                    upcoming30DaysSpend = upcoming30,
                    subscriptions = subs,
                    reminders = reminders
                )
            }.collect { state ->
                _uiState.value = state
            }
        }
    }

    fun selectTab(tabIndex: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = tabIndex)
    }

    fun addSubscription(subscription: SubscriptionEntity) {
        viewModelScope.launch {
            repository.insertAndSchedule(subscription)
        }
    }

    fun deleteSubscription(id: String) {
        viewModelScope.launch {
            repository.deleteSubscription(id)
        }
    }

    class Factory(private val repository: SubscriptionRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ChargeGuardViewModel(repository) as T
        }
    }
}
