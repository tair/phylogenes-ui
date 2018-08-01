<template>
    <div>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item">
                    <router-link to="/" tag="li">
                        <a class="nav-link p-0"  data-toggle="tooltip" title="Home">
                           Home
                        </a>
                    </router-link>
                </li>
                <li class="breadcrumb-item active" aria-current="page">{{ currentPage }}</li>
            </ol>
        </nav>
    </div>
</template>

<script>
    export default {
        name: "SiteMap",
        props: {
            currentPage: {
                type: String,
                required: true
            }
        }
    }
</script>

<style scoped>
    .breadcrumb {
        background: #dddddd;
        padding: 15px;
        margin-bottom: 0px;
    }
</style>

