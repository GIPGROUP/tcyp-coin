require('dotenv').config();
const axios = require('axios');

// URL вашего API
const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://tcyp-coin.onrender.com/api'
    : 'http://localhost:3000/api';

// Токен администратора (нужно получить через логин)
let adminToken = '';

async function loginAsAdmin() {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@tcyp.ru',
            password: 'admin123'
        });
        adminToken = response.data.token;
        console.log('✅ Успешный вход как администратор');
        return true;
    } catch (error) {
        console.error('❌ Ошибка входа:', error.response?.data || error.message);
        return false;
    }
}

async function getEmployees() {
    try {
        const response = await axios.get(`${API_URL}/admin/employees`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('\n📋 Список сотрудников:');
        response.data.forEach(emp => {
            console.log(`  - ${emp.full_name} (ID: ${emp.id}, Баланс: ${emp.coins})`);
        });
        return response.data;
    } catch (error) {
        console.error('❌ Ошибка получения сотрудников:', error.response?.data || error.message);
        return [];
    }
}

async function testAddCoins(userId, amount) {
    try {
        console.log(`\n💰 Тестируем добавление ${amount} коинов пользователю ID ${userId}...`);
        const response = await axios.post(
            `${API_URL}/admin/coins/add`,
            {
                userId: userId,
                amount: amount,
                reason: 'Тестовое добавление коинов'
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );
        console.log('✅ Успешно:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Ошибка добавления коинов:');
        console.error('  Статус:', error.response?.status);
        console.error('  Данные:', error.response?.data);
        console.error('  Сообщение:', error.message);
        return false;
    }
}

async function testSubtractCoins(userId, amount) {
    try {
        console.log(`\n💸 Тестируем списание ${amount} коинов у пользователя ID ${userId}...`);
        const response = await axios.post(
            `${API_URL}/admin/coins/subtract`,
            {
                userId: userId,
                amount: amount,
                reason: 'Тестовое списание коинов'
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );
        console.log('✅ Успешно:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Ошибка списания коинов:');
        console.error('  Статус:', error.response?.status);
        console.error('  Данные:', error.response?.data);
        console.error('  Сообщение:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Начинаем тестирование кнопок администратора...\n');
    console.log(`📍 API URL: ${API_URL}`);
    
    // Входим как администратор
    if (!await loginAsAdmin()) {
        console.log('\n❌ Не удалось войти как администратор');
        return;
    }
    
    // Получаем список сотрудников
    const employees = await getEmployees();
    if (employees.length === 0) {
        console.log('\n❌ Нет сотрудников для тестирования');
        return;
    }
    
    // Берем первого не-администратора
    const testEmployee = employees.find(emp => emp.id !== 1) || employees[0];
    console.log(`\n🧪 Тестируем на сотруднике: ${testEmployee.full_name} (ID: ${testEmployee.id})`);
    
    // Тестируем добавление коинов
    await testAddCoins(testEmployee.id, 100);
    
    // Ждем немного
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Тестируем списание коинов
    await testSubtractCoins(testEmployee.id, 50);
    
    // Проверяем итоговый баланс
    await new Promise(resolve => setTimeout(resolve, 1000));
    const updatedEmployees = await getEmployees();
    const updatedEmployee = updatedEmployees.find(emp => emp.id === testEmployee.id);
    
    if (updatedEmployee) {
        console.log(`\n📊 Итоговый баланс: ${updatedEmployee.coins} коинов`);
        const expectedBalance = testEmployee.coins + 100 - 50;
        if (updatedEmployee.coins === expectedBalance) {
            console.log('✅ Тест пройден успешно!');
        } else {
            console.log(`❌ Ожидался баланс ${expectedBalance}, но получен ${updatedEmployee.coins}`);
        }
    }
}

// Запускаем тесты
runTests().catch(console.error);