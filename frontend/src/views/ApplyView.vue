<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import type { TimecardSession } from '../timecard-session-interface';

const route = useRoute();
console.log(route.params.type);

const applyTypeNames: { [key: string]: string } = {
  'record': '打刻',
  'leave': '休暇',
  'overtime': '早出/残業',
  'lateness': '遅刻',
  'earliness': '早退',
  'withdrawal': '外出',
  'holidaywork': '休日出勤',
  'leaveproxy': '代休',
  'other': 'その他'
};

const applyTypeName = applyTypeNames[route.params.type as string];

const session = inject<TimecardSession>('session');

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
          <div class="container-fluid">
            <span class="navbar-text">管理画面</span>
            <div class="collapse navbar-collapse justify-content-end">
              <!-- <span class="navbar-text">管理者PC</span> -->
              <span class="navbar-text">{{ session?.userName }}</span>
            </div>
            <RouterLink to="/logout" class="ms-2 btn btn-warning btn-sm" role="button">ログアウト</RouterLink>
          </div>
        </nav>
      </div>
    </div>

    <div class="row">
      <div class="col-10 bg-white p-2 shadow-sm">
        <div class="row justify-content-center">
          <div class="col-12 text-center">
            <h5>{{ applyTypeName }}申請書</h5>
          </div>
        </div>
        <div class="row">
          <div class="col-2">
            <div class="row">
              <div class="col">
                <div class="card border-dark">
                  <div class="card-header m-0 p-1 bg-dark text-white">申請</div>
                  <div class="card-body m-0 p-1">
                    <p class="card-text fs-6 m-0">2022/03/05</p>
                    <p class="card-title fs-6 m-0">山田 太郎</p>
                  </div>
                </div>
                <div class="card border-dark">
                  <div class="card-header m-0 p-1 bg-dark text-white">承認1</div>
                  <div class="card-body m-0 p-1">
                    <p class="card-text fs-6 m-0">&nbsp;</p>
                    <p class="card-title fs-6 m-0">&nbsp;</p>
                  </div>
                </div>
                <div class="card border-dark">
                  <div class="card-header m-0 p-1 bg-dark text-white">承認2</div>
                  <div class="card-body m-0 p-1">
                    <p class="card-text fs-6 m-0">&nbsp;</p>
                    <p class="card-title fs-6 m-0">&nbsp;</p>
                  </div>
                </div>
                <div class="card border-dark">
                  <div class="card-header m-0 p-1 bg-dark text-white">決済</div>
                  <div class="card-body m-0 p-1">
                    <p class="card-text fs-6 m-0">&nbsp;</p>
                    <p class="card-title fs-6 m-0">&nbsp;</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="row"></div>
            <div class="row"></div>
          </div>
          <div class="col-10">
            <div class="row">
              <div class="col-6">
                <div class="row">
                  <div class="col-3 bg-dark text-white border border-dark">申請日</div>
                  <div class="col-9 bg-white text-black border border-dark">2022/03/06</div>
                </div>
                <div class="row">
                  <div class="col-3 bg-dark text-white border border-dark">所属</div>
                  <div class="col-9 bg-white text-black border border-dark">営業部</div>
                </div>
                <div class="row">
                  <div class="col-3 bg-dark text-white border border-dark">氏名</div>
                  <div class="col-9 bg-white text-black border border-dark">山田 太郎</div>
                </div>
              </div>
              <div class="col-2"></div>
              <div class="col-4">
                <div class="row">
                  <div class="col">有給残</div>
                  <div class="col">8.5日</div>
                </div>
                <div class="row">
                  <div class="col">時間有給</div>
                  <div class="col">40:00</div>
                </div>
                <div class="row">
                  <div class="col">遅刻回数</div>
                  <div class="col">0回</div>
                </div>
                <div class="row">
                  <div class="col">遅刻時間</div>
                  <div class="col">00:00</div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-2 bg-dark text-white border border-dark">種類</div>
              <div class="col-9 bg-white text-black border border-dark">
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="apply-type"
                    id="apply-type-notyet"
                    value="notyet"
                    checked
                  />
                  <label class="form-check-label" for="apply-type-notyet">未打刻</label>
                </div>
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="apply-type"
                    id="apply-type-athome"
                    value="athome"
                  />
                  <label class="form-check-label" for="apply-type-athome">在宅</label>
                </div>
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="apply-type"
                    id="apply-type-visit"
                    value="visit"
                  />
                  <label class="form-check-label" for="apply-type-visit">出張</label>
                </div>
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="apply-type"
                    id="apply-type-withdrawal"
                    value="withdrawal"
                  />
                  <label class="form-check-label" for="apply-type-withdrawal">外出</label>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-2 bg-dark text-white border border-dark">日付</div>
              <div class="col-9 bg-white text-black border border-dark">
                <input type="date" value="2022-03-07" />
              </div>
            </div>
            <div class="row">
              <div class="col-2 bg-dark text-white border border-dark">時刻</div>
              <div class="col-9 bg-white text-black border border-dark">
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="apply-actual"
                    id="apply-actual-attend"
                    value="attend"
                    checked
                  />
                  <label class="form-check-label" for="apply-actual-attend">出勤</label>
                </div>
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="apply-actual"
                    id="apply-actual-leave"
                    value="leave"
                  />
                  <label class="form-check-label" for="apply-actual-leave">退勤</label>
                </div>
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="apply-actual"
                    id="apply-actual-outofoffice"
                    value="outofoffice"
                  />
                  <label class="form-check-label" for="apply-actual-outofoffice">外出</label>
                </div>
                <div class="form-check form-check-inline">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="apply-actual"
                    id="apply-actual-reentry"
                    value="reentry"
                  />
                  <label class="form-check-label" for="apply-actual-reentry">再入</label>
                </div>
                <input type="time" />
              </div>
            </div>
            <div class="row">
              <div class="col-2 bg-dark text-white border border-dark">理由</div>
              <div class="col-9 bg-white text-black border border-dark">
                <textarea rows="3" cols="32"></textarea>
              </div>
            </div>
            <div class="row g-2 mt-2">
              <div class="d-grid col gap-2">
                <button type="button" class="btn btn-warning btn-lg">申請</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-2">
        <div class="row">承認待ち</div>
        <div class="row">否認</div>
        <div class="row">決済済</div>
        <div class="row">申請</div>
      </div>
    </div>
  </div>
  <!--
<main>
    <TheWelcome />
  </main>
  -->
</template>

<style>
body {
  background: navajowhite !important;
} /* Adding !important forces the browser to overwrite the default style applied by Bootstrap */

.btn-primary {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
</style>